import { networkAllowed } from "../stores/privacy-store"
const DATABASE = "oh-my-tab-icons"
const STORE = "favicons"
const RETRY_DELAY = 15 * 60 * 1000
const MAX_BYTES = 2 * 1024 * 1024

type IconRecord = {
  url: string
  version?: number
  blob?: Blob
  retryAfter?: number
  sourcesVersion?: number
}
type MemoryEntry = { promise: Promise<string | null>; expires: number }
const memory = new Map<string, MemoryEntry>()
let database: Promise<IDBDatabase | null> | null = null

export function faviconKey(url: string): string | null {
  try {
    const parsed = new URL(url)
    if (!["http:", "https:"].includes(parsed.protocol)) return null
    return new URL("/favicon.ico", parsed.origin).href
  } catch {
    return null
  }
}

function openDatabase() {
  if (!database)
    database = new Promise<IDBDatabase | null>((resolve) => {
      try {
        const request = indexedDB.open(DATABASE, 1)
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains(STORE))
            request.result.createObjectStore(STORE, { keyPath: "url" })
        }
        request.onsuccess = () => {
          const db = request.result
          db.onversionchange = () => {
            db.close()
            database = null
          }
          resolve(db)
        }
        request.onerror = () => resolve(null)
        request.onblocked = () => resolve(null)
      } catch {
        resolve(null)
      }
    })
  return database
}

async function readIcon(url: string): Promise<IconRecord | undefined> {
  const db = await openDatabase()
  if (!db) return undefined
  return new Promise((resolve) => {
    try {
      const request = db
        .transaction(STORE, "readonly")
        .objectStore(STORE)
        .get(url)
      request.onsuccess = () =>
        resolve(request.result as IconRecord | undefined)
      request.onerror = () => resolve(undefined)
    } catch {
      resolve(undefined)
    }
  })
}

async function writeIcon(record: IconRecord) {
  const db = await openDatabase()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const transaction = db.transaction(STORE, "readwrite")
      transaction.objectStore(STORE).put(record)
      transaction.oncomplete = () => resolve()
      transaction.onerror = () => resolve()
      transaction.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

async function imageUrl(blob: Blob): Promise<string> {
  const src = URL.createObjectURL(blob)
  try {
    await new Promise<void>((resolve, reject) => {
      const image = new Image()
      const timer = setTimeout(() => {
        image.src = ""
        reject(new Error("Image decode timeout"))
      }, 5000)
      image.onload = () => {
        clearTimeout(timer)
        if (
          image.naturalWidth > 0 &&
          image.naturalWidth <= 2048 &&
          image.naturalHeight <= 2048
        )
          resolve()
        else reject(new Error("Invalid icon dimensions"))
      }
      image.onerror = () => {
        clearTimeout(timer)
        reject(new Error("Invalid image"))
      }
      image.src = src
    })
    return src
  } catch (error) {
    URL.revokeObjectURL(src)
    throw error
  }
}

type IconSource = "origin" | "favicon-im" | "duckduckgo"
const SOURCES: IconSource[] = ["favicon-im", "duckduckgo"]
const SOURCES_VERSION = 5

async function downloadIcon(
  url: string,
  source: IconSource,
  fresh = false
): Promise<Blob> {
  const extension = ["chrome-extension:", "moz-extension:"].includes(
    window.location.protocol
  )
  const site = new URL(url)
  const domain = encodeURIComponent(site.hostname)
  const remote =
    source === "favicon-im"
      ? `https://a.favicon.im/${domain}?larger=true&throw-error-on-404=true`
      : source === "duckduckgo"
        ? `https://icons.duckduckgo.com/ip3/${domain}.ico`
        : url
  const endpoint = extension
    ? remote
    : `/__favicon?origin=${encodeURIComponent(site.origin)}&source=${source}`
  return fetchBlob(endpoint, fresh)
}

async function fetchBlob(
  endpoint: string,
  fresh = false,
  onResponse?: (response: Response) => void,
  maxBytes = MAX_BYTES
): Promise<Blob> {
  const response = await fetch(endpoint, {
    cache: fresh ? "reload" : "default",
    credentials: "omit",
    referrerPolicy: "no-referrer",
    signal: AbortSignal.timeout(10000),
  })
  if (!response.ok || !response.body) throw new Error("Icon download failed")
  onResponse?.(response)
  const reader = response.body.getReader()
  const chunks: ArrayBuffer[] = []
  let size = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > maxBytes) {
        await reader.cancel()
        throw new Error("Icon too large")
      }
      chunks.push(value.slice().buffer as ArrayBuffer)
    }
  } finally {
    reader.releaseLock()
  }
  if (!size) throw new Error("Empty icon")
  return new Blob(chunks, {
    type: response.headers.get("content-type")?.split(";")[0] || "image/x-icon",
  })
}

async function loadIcon(url: string, fresh = false): Promise<string | null> {
  const record = await readIcon(url)
  if (
    !fresh &&
    record?.version === SOURCES_VERSION &&
    record?.blob instanceof Blob &&
    record.blob.size
  ) {
    try {
      return await imageUrl(record.blob)
    } catch {
      /* Replace an unreadable cached icon. */
    }
  }
  if (
    !fresh &&
    record?.sourcesVersion === SOURCES_VERSION &&
    record.retryAfter &&
    record.retryAfter > Date.now()
  )
    return null
  if (!(await networkAllowed("icons"))) return null
  for (const source of SOURCES) {
    if (!(await networkAllowed("icons"))) return null
    try {
      const blob = await downloadIcon(url, source, fresh)
      const src = await imageUrl(blob)
      await writeIcon({ url, blob, version: SOURCES_VERSION })
      return src
    } catch {
      // Try the next source after a failed download or image decode.
    }
  }
  await writeIcon({
    url,
    retryAfter: Date.now() + RETRY_DELAY,
    sourcesVersion: SOURCES_VERSION,
  })
  return null
}

export function getCachedFavicon(
  url: string,
  fresh = false
): Promise<string | null> {
  const key = faviconKey(url)
  if (!key) return Promise.resolve(null)
  const cached = memory.get(key)
  if (!fresh && cached && cached.expires > Date.now()) return cached.promise
  const entry: MemoryEntry = {
    expires: Infinity,
    promise: Promise.resolve(null),
  }
  entry.promise = (
    navigator.locks
      ? navigator.locks.request(`omt-favicon:${key}`, () =>
          loadIcon(key, fresh)
        )
      : loadIcon(key, fresh)
  )
    .catch(() => null)
    .then((src) => {
      if (!src) entry.expires = Date.now() + RETRY_DELAY
      return src
    })
  memory.set(key, entry)
  return entry.promise
}

const listeners = new Set<(key: string) => void>()
export function subscribeFavicon(listener: (key: string) => void) {
  listeners.add(listener)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== "omt.favicon-update" || !event.newValue) return
    try {
      const { key } = JSON.parse(event.newValue)
      if (typeof key === "string") {
        memory.delete(key)
        listener(key)
      }
    } catch {
      /* Ignore unrelated data. */
    }
  }
  window.addEventListener("storage", onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener("storage", onStorage)
  }
}
export async function refreshFavicon(url: string) {
  const key = faviconKey(url)
  if (!key) return
  await getCachedFavicon(url, true)
  listeners.forEach((listener) => listener(key))
  try {
    localStorage.setItem(
      "omt.favicon-update",
      JSON.stringify({ key, nonce: crypto.randomUUID() })
    )
  } catch {
    /* Local refresh still works. */
  }
}

export function reloadVisibleFavicons() {
  const keys = [...memory.keys()]
  memory.clear()
  for (const key of keys) listeners.forEach((listener) => listener(key))
}
