import { i18n } from "@/i18n"
import {
  parseRemoteIndex,
  type RemoteIndex,
  type WebdavSnapshot,
} from "@/lib/webdav-history"

type RemoteFile = {
  blob: Blob
  etag: string | null
  lastModified: number | null
}
type MigrationIO = {
  snapshotLimit: number
  fetch: (file: string, maxBytes?: number) => Promise<RemoteFile | null>
  convert: (
    blob: Blob
  ) => Promise<{ blob: Blob; sourceHash: string; hash: string }>
  putSnapshot: (file: string, blob: Blob) => Promise<void>
  putIndex: (
    index: RemoteIndex,
    etag: string | null,
    exists: boolean
  ) => Promise<void>
  removeSource: (file: string, etag: string | null) => Promise<void>
  cleanup: (index: RemoteIndex) => Promise<boolean>
}
const INDEX = "oh-my-tab-sync.json"
const MAX_INDEX_BYTES = 4 * 1024 * 1024
function invalid(): never {
  throw new Error(i18n.t("settings.webdav.invalidHistory"))
}
function requireEtag(file: RemoteFile) {
  if (!file.etag || file.etag.startsWith("W/"))
    throw new Error(i18n.t("settings.webdav.weakEtagServer"))
}

// Upload converted files first. The conditional index write is the commit
// point; old files remain usable if conversion or the commit fails.
export function migrateRemoteHistory(
  io: MigrationIO
): Promise<RemoteFile | null> {
  return navigator.locks.request("omt-webdav-history-migration", () =>
    migrate(io)
  )
}

async function migrate(io: MigrationIO): Promise<RemoteFile | null> {
  const existing = await io.fetch(INDEX, MAX_INDEX_BYTES)
  let index: RemoteIndex
  let legacy: RemoteFile | null = null
  if (existing) {
    const raw = JSON.parse(await existing.blob.text())
    if (raw?.version === 4) return existing
    if (![1, 2, 3].includes(raw?.version)) invalid()
    requireEtag(existing)
    index = parseRemoteIndex(JSON.stringify({ ...raw, version: 4 }))
  } else {
    legacy = await io.fetch("oh-my-tab.zip")
    if (!legacy) return null
    requireEtag(legacy)
    index = {
      version: 4,
      snapshotLimit: io.snapshotLimit,
      snapshots: [],
      garbage: [],
    }
  }
  const snapshots: WebdavSnapshot[] = []
  const protectedHashes = new Set<string>()
  const append = (snapshot: WebdavSnapshot) => {
    if (
      snapshot.protected &&
      !snapshot.manual &&
      protectedHashes.has(snapshot.hash)
    )
      snapshot = { ...snapshot, manual: true }
    snapshots.push(snapshot)
    if (snapshot.protected) protectedHashes.add(snapshot.hash)
  }
  const sources = legacy ? [null] : index.snapshots
  for (const source of sources) {
    const file = source ? await io.fetch(source.file) : legacy
    if (!file) invalid()
    const converted = await io.convert(file.blob)
    if (source && source.hash !== converted.sourceHash) invalid()
    if (source && source.hash === converted.hash) {
      append(source)
      continue
    }
    const id = crypto.randomUUID()
    const filename = `oh-my-tab-snapshot-${id}.zip`
    await io.putSnapshot(filename, converted.blob)
    append({
      ...(source ?? {
        deviceId: "",
        uploadedAt: null,
        modifiedAt: file.lastModified,
        change: null,
      }),
      id,
      file: filename,
      hash: converted.hash,
    })
  }
  if (legacy) {
    const check = await io.fetch("oh-my-tab.zip")
    if (!check || check.etag !== legacy.etag)
      throw new Error(i18n.t("settings.webdav.conflict"))
  }
  const retainedFiles = new Set(snapshots.map((snapshot) => snapshot.file))
  const next: RemoteIndex = {
    ...index,
    snapshots,
    garbage: [
      ...new Set([
        ...index.garbage,
        ...index.snapshots
          .filter((snapshot) => !retainedFiles.has(snapshot.file))
          .map((snapshot) => snapshot.file),
      ]),
    ],
  }
  parseRemoteIndex(JSON.stringify(next))
  await io.putIndex(next, existing?.etag ?? null, !!existing)
  if (legacy) {
    // The new index is authoritative even if server permissions prevent
    // deleting the obsolete source; it is never read again.
    try {
      await io.removeSource("oh-my-tab.zip", legacy.etag)
    } catch {
      /* Committed index remains authoritative. */
    }
  }
  await io.cleanup(next)
  const committed = await io.fetch(INDEX, MAX_INDEX_BYTES)
  if (!committed) invalid()
  return committed
}
