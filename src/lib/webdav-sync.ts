import { sha256 } from "@/lib/backup-codec"

export const DEFAULT_SNAPSHOT_LIMIT = 5
export function webdavSnapshotTime(snapshot: {
  uploadedAt: number | null
  modifiedAt?: number | null
}): number | null {
  return snapshot.uploadedAt && snapshot.uploadedAt > 0
    ? snapshot.uploadedAt
    : (snapshot.modifiedAt ?? null)
}
export function validWebdavSnapshotName(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= 80 &&
    Array.from(value).every((character) => {
      const code = character.charCodeAt(0)
      return code >= 32 && code !== 127
    })
  )
}
export function defaultWebdavSnapshotName(timestamp: number): string {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, "0")
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
export function webdavSnapshotName(snapshot: {
  name?: string
  file: string
  uploadedAt: number | null
  modifiedAt?: number | null
}): string {
  if (snapshot.name) return snapshot.name
  const timestamp = webdavSnapshotTime(snapshot)
  return timestamp === null
    ? snapshot.file
    : defaultWebdavSnapshotName(timestamp)
}
export function validSnapshotLimit(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) >= 1 && Number(value) <= 100
}
export function stableJson(value: unknown): string {
  return JSON.stringify(value, (_, item) =>
    item && typeof item === "object" && !Array.isArray(item)
      ? Object.fromEntries(
          Object.entries(item).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        )
      : item
  )
}
export type ChangeSummary = {
  changed: number
  removed: number
  total: number
  ratio: number
  large: boolean
}
// Arrays with IDs represent collections: compare individual items rather than
// treating an entire bookmark collection as one setting.
function entries(
  value: unknown,
  path = "",
  result = new Map<string, string>()
) {
  if (path.endsWith("/layouts")) {
    result.set(path, stableJson(value))
    return result
  }
  if (
    Array.isArray(value) &&
    value.every((item) => item && typeof item.id === "string")
  ) {
    for (const item of value) entries(item, `${path}/${item.id}`, result)
  } else if (value && typeof value === "object" && !Array.isArray(value)) {
    for (const [key, item] of Object.entries(value)) {
      if (key === "items" || key === "tabs")
        entries(item, `${path}/${key}`, result)
      else if (path.includes("/items/") || path.includes("/tabs/")) {
        // One change unit per bookmark/widget, plus its nested bookmarks.
        const content = Object.fromEntries(
          Object.entries(value).filter(([name]) => name !== "tabs")
        )
        result.set(path, stableJson(content))
        if ("tabs" in value) entries(value.tabs, `${path}/tabs`, result)
        break
      } else entries(item, `${path}/${key}`, result)
    }
  } else result.set(path, stableJson(value))
  return result
}
export function compareBackupContent(
  before: unknown,
  after: unknown
): ChangeSummary {
  const a = entries(before)
  const b = entries(after)
  const keys = new Set([...a.keys(), ...b.keys()])
  const changed = [...keys].filter((key) => a.get(key) !== b.get(key)).length
  const removed = [...a.keys()].filter((key) => !b.has(key)).length
  const total = Math.max(keys.size, 1)
  const ratio = changed / total
  return { changed, removed, total, ratio, large: ratio > 0.3 || removed >= 5 }
}
export async function contentHash(config: unknown, image?: Blob) {
  const imageHash = image
    ? await sha256(new Uint8Array(await image.arrayBuffer()))
    : null
  return sha256(
    new TextEncoder().encode(stableJson({ config, image: imageHash }))
  )
}
export type SyncBaseline = { localHash: string; remoteId: string }
export type SyncDirection = "upload" | "download" | "equal" | "choose"
export function syncDirection(input: {
  localHash: string
  remoteHash?: string
  remoteId?: string
  remoteDevice?: string
  deviceId: string
  baseline?: SyncBaseline
  large: boolean
}): SyncDirection {
  const {
    localHash,
    remoteHash,
    remoteId,
    remoteDevice,
    deviceId,
    baseline,
    large,
  } = input
  if (!remoteHash) return "upload"
  if (localHash === remoteHash) return "equal"
  if (!baseline) return "download"
  if (baseline.remoteId === remoteId) return "upload"
  if (baseline.localHash !== localHash) return "choose"
  if (large) return "choose"
  return remoteDevice === deviceId ? "upload" : "download"
}
