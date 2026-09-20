import { createJSONStorage, type StateStorage } from "zustand/middleware"

import { i18n } from "@/i18n"

const DATABASE = "oh-my-tab-data"
const TABLE = "entries"
export const DATA_KEYS = [
  "omt.home-settings",
  "omt.theme-mode",
  "omt.search-engines",
  "omt.tab-grid",
  "omt.garden",
  "omt.onboarding",
] as const
export const DEVICE_KEYS = [
  "omt.privacy",
  "omt.webdav",
  "omt.sync-provider",
  "omt.locale",
] as const
const REVISION = "omt.revision"
type ChromeStorage = {
  local: {
    get(keys: string[] | null): Promise<Record<string, unknown>>
    set(values: Record<string, unknown>): Promise<void>
    remove(keys: string[]): Promise<void>
    setAccessLevel?(options: { accessLevel: "TRUSTED_CONTEXTS" }): Promise<void>
  }
}
export const chromeStorage = () =>
  location.protocol === "chrome-extension:"
    ? (
        globalThis as typeof globalThis & {
          chrome?: { storage?: ChromeStorage }
        }
      ).chrome?.storage
    : undefined
export const storageLabel = () =>
  chromeStorage()
    ? i18n.t("core.storage.chromeLabel")
    : i18n.t("core.storage.indexedDbLabel")
let dbPromise: Promise<IDBDatabase> | undefined
function database() {
  return (dbPromise ??= new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1)
    request.onupgradeneeded = () => request.result.createObjectStore(TABLE)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    request.onblocked = () => reject(new Error(i18n.t("core.storage.blocked")))
  }))
}
export async function readEntries(
  keys: string[]
): Promise<Record<string, unknown>> {
  const chrome = chromeStorage()
  if (chrome) return chrome.local.get(keys)
  const db = await database()
  return new Promise((resolve, reject) => {
    const result: Record<string, unknown> = {}
    const tx = db.transaction(TABLE, "readonly")
    for (const key of keys) {
      const request = tx.objectStore(TABLE).get(key)
      request.onsuccess = () => {
        result[key] = request.result
      }
    }
    tx.oncomplete = () => resolve(result)
    tx.onabort = tx.onerror = () => reject(tx.error)
  })
}
const channel = new BroadcastChannel("omt-data")
if (import.meta.hot) import.meta.hot.dispose(() => channel.close())
const listeners = new Set<(keys: string[]) => void>()
channel.onmessage = (event) => {
  if (Array.isArray(event.data))
    listeners.forEach((listener) => listener(event.data))
}
export function subscribeStorage(listener: (keys: string[]) => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}
let queue = Promise.resolve()
let writeError: unknown
export function writeEntries(
  values: Record<string, unknown>,
  notify = true,
  expected?: Record<string, unknown>
): Promise<void> {
  const operation = async () => {
    const keys = Object.keys(values)
    if (expected) {
      const current = await readEntries(Object.keys(expected))
      if (Object.keys(expected).some((key) => current[key] !== expected[key]))
        throw new Error(i18n.t("core.storage.staleWrite"))
    }
    const entries = keys.some((key) =>
      (DATA_KEYS as readonly string[]).includes(key)
    )
      ? { ...values, [REVISION]: crypto.randomUUID() }
      : values
    const chrome = chromeStorage()
    if (chrome) await chrome.local.set(entries)
    else {
      const db = await database()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TABLE, "readwrite")
        for (const [key, value] of Object.entries(entries))
          tx.objectStore(TABLE).put(value, key)
        tx.oncomplete = () => resolve()
        tx.onabort = tx.onerror = () => reject(tx.error)
      })
    }
    if (notify) channel.postMessage(keys)
  }
  const result = queue.then(() =>
    navigator.locks.request("omt-write", operation)
  )
  queue = result.catch((error) => {
    writeError = error
    window.dispatchEvent(
      new CustomEvent("omt-storage-error", {
        detail: error instanceof Error ? error.message : i18n.t("core.storage.saveFailed"),
      })
    )
    listeners.forEach((listener) => listener(Object.keys(values)))
  })
  return result
}
export async function flushStorage() {
  await queue
  if (writeError) {
    const error = writeError
    writeError = undefined
    throw error instanceof Error
      ? error
      : new Error(i18n.t("core.storage.persistFailed"))
  }
}
export async function storageRevision() {
  await flushStorage()
  return (await readEntries([REVISION]))[REVISION] as string | undefined
}
export async function initializeStorage() {
  if (location.protocol === "chrome-extension:" && !chromeStorage())
    throw new Error(i18n.t("core.storage.permission"))
  await chromeStorage()?.local.setAccessLevel?.({
    accessLevel: "TRUSTED_CONTEXTS",
  })
  const keys = [...DATA_KEYS, ...DEVICE_KEYS]
  const current = await readEntries(keys)
  const migrated: Record<string, unknown> = {}
  for (const key of keys) {
    const legacy = localStorage.getItem(key)
    if (current[key] === undefined && legacy !== null) {
      JSON.parse(legacy)
      migrated[key] = legacy
    }
  }
  if (Object.keys(migrated).length) await writeEntries(migrated, false)
  // Keep the legacy copy available for recovery after migration.
}
const loaded = new Map<string, unknown>()
const adapter: StateStorage = {
  async getItem(name) {
    const value = (await readEntries([name]))[name]
    loaded.set(name, value)
    return typeof value === "string" ? value : null
  },
  setItem(name, value) {
    const before = loaded.get(name)
    if (before === value) return
    loaded.set(name, value)
    void writeEntries({ [name]: value }, true, { [name]: before }).catch(
      () => {}
    )
  },
  removeItem(name) {
    void writeEntries({ [name]: null }).catch(() => {})
  },
}
export function storageOptions<T = unknown>() {
  return { storage: createJSONStorage<T>(() => adapter), skipHydration: true }
}

export async function putAsset(blob: Blob): Promise<string> {
  const id = `asset:${crypto.randomUUID()}`
  const value = chromeStorage() ? await blobToDataUrl(blob) : blob
  await writeEntries({ [id]: { createdAt: Date.now(), value } })
  return id
}
export async function getAsset(id: string): Promise<Blob> {
  const record = (await readEntries([id]))[id]
  const value =
    record && typeof record === "object" && "value" in record
      ? record.value
      : record
  if (value instanceof Blob) return value
  if (typeof value === "string" && value.startsWith("data:image/"))
    return dataUrlToBlob(value)
  throw new Error(i18n.t("core.storage.missingAsset"))
}
export async function blobToDataUrl(blob: Blob): Promise<string> {
  const bytes = new Uint8Array(await blob.arrayBuffer())
  let binary = ""
  for (let i = 0; i < bytes.length; i += 8192)
    binary += String.fromCharCode(...bytes.subarray(i, i + 8192))
  return `data:${blob.type};base64,${btoa(binary)}`
}
export function dataUrlToBlob(value: string): Blob {
  const match = /^data:([^;,]+);base64,(.*)$/s.exec(value)
  if (!match) throw new Error(i18n.t("core.storage.invalidImage"))
  const binary = atob(match[2])
  return new Blob([Uint8Array.from(binary, (char) => char.charCodeAt(0))], {
    type: match[1],
  })
}

export async function replaceData(
  values: Record<string, unknown>,
  revision: string | undefined
) {
  await flushStorage()
  await writeEntries(values, true, { [REVISION]: revision })
}
export async function allEntries(): Promise<Record<string, unknown>> {
  const chrome = chromeStorage()
  if (chrome) return chrome.local.get(null)
  const db = await database()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(TABLE, "readonly")
    const result: Record<string, unknown> = {}
    const cursor = tx.objectStore(TABLE).openCursor()
    cursor.onsuccess = () => {
      if (!cursor.result) return
      result[String(cursor.result.key)] = cursor.result.value
      cursor.result.continue()
    }
    tx.oncomplete = () => resolve(result)
    tx.onabort = tx.onerror = () => reject(tx.error)
  })
}
export async function clearCachedData() {
  await flushStorage()
  await navigator.locks.request("omt-write", async () => {
    const entries = await allEntries()
    const home =
      typeof entries["omt.home-settings"] === "string"
        ? JSON.parse(entries["omt.home-settings"]).state
        : null
    const keys = Object.keys(entries).filter((key) => {
      if (key.startsWith("cache:")) return true
      const entry = entries[key] as { createdAt?: number } | null
      return (
        key.startsWith("asset:") &&
        key !== home?.backgroundImage &&
        entry?.createdAt &&
        entry.createdAt < Date.now() - 86400000
      )
    })
    const chrome = chromeStorage()
    if (chrome) await chrome.local.remove(keys)
    else {
      const db = await database()
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(TABLE, "readwrite")
        for (const key of keys) tx.objectStore(TABLE).delete(key)
        tx.oncomplete = () => resolve()
        tx.onabort = tx.onerror = () => reject(tx.error)
      })
    }
    channel.postMessage(keys)
  })
}

export async function editStoredEntries(
  plan: (entries: Record<string, unknown>) => {
    updates: Record<string, unknown>
    remove: string[]
  }
) {
  await flushStorage()
  await navigator.locks.request("omt-write", async () => {
    const { updates, remove } = plan(await allEntries())
    const changed = [...Object.keys(updates), ...remove]
    if (!changed.length) return
    const values = { ...updates, [REVISION]: crypto.randomUUID() }
    const chrome = chromeStorage()
    try {
      if (chrome) {
        await chrome.local.set(values)
        if (remove.length) await chrome.local.remove(remove)
      } else {
        const db = await database()
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(TABLE, "readwrite")
          for (const [key, value] of Object.entries(values))
            tx.objectStore(TABLE).put(value, key)
          for (const key of remove) tx.objectStore(TABLE).delete(key)
          tx.oncomplete = () => resolve()
          tx.onabort = tx.onerror = () => reject(tx.error)
        })
      }
    } finally {
      channel.postMessage(changed)
      listeners.forEach((listener) => listener(changed))
    }
  })
}
