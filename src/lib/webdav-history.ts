import { i18n } from "@/i18n"
import {
  validSnapshotLimit,
  validWebdavSnapshotName,
  type ChangeSummary,
} from "@/lib/webdav-sync"
const MAX_SNAPSHOTS = 10000
const snapshotFile = /^oh-my-tab-snapshot-[a-f0-9-]{36}\.zip$/
function invalidIndex(): never {
  throw new Error(i18n.t("settings.webdav.invalidHistory"))
}
export type WebdavSnapshot = {
  id: string
  file: string
  deviceId: string
  manual?: boolean
  name?: string
  protected?: boolean
  uploadedAt: number | null
  modifiedAt?: number | null
  hash: string
  change: ChangeSummary | null
}
export type RemoteIndex = {
  version: 4
  snapshotLimit: number
  snapshots: WebdavSnapshot[]
  garbage: string[]
}
export function parseRemoteIndex(text: string): RemoteIndex {
  const value = JSON.parse(text)
  if (
    value?.version !== 4 ||
    !validSnapshotLimit(value.snapshotLimit) ||
    !Array.isArray(value.snapshots) ||
    value.snapshots.length > MAX_SNAPSHOTS ||
    !Array.isArray(value.garbage) ||
    value.garbage.length > MAX_SNAPSHOTS + 1000
  )
    invalidIndex()
  const ids = new Set<string>()
  const protectedHashes = new Set<string>()
  for (const item of value.snapshots) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !snapshotFile.test(item.file) ||
      item.file !== `oh-my-tab-snapshot-${item.id}.zip` ||
      ids.has(item.id) ||
      typeof item.deviceId !== "string" ||
      (item.manual !== undefined && typeof item.manual !== "boolean") ||
      (item.uploadedAt !== null &&
        (!Number.isFinite(item.uploadedAt) ||
          item.uploadedAt < 0 ||
          item.uploadedAt > 8.64e15)) ||
      (item.modifiedAt != null &&
        (!Number.isFinite(item.modifiedAt) ||
          item.modifiedAt < 0 ||
          item.modifiedAt > 8.64e15)) ||
      (item.name !== undefined && !validWebdavSnapshotName(item.name)) ||
      (item.protected !== undefined && typeof item.protected !== "boolean") ||
      !/^[a-f0-9]{64}$/.test(item.hash)
    )
      invalidIndex()
    ids.add(item.id)
    if (item.protected && !item.manual) {
      if (protectedHashes.has(item.hash)) invalidIndex()
      protectedHashes.add(item.hash)
    }
    if (
      item.change !== null &&
      (!item.change ||
        typeof item.change.large !== "boolean" ||
        !Number.isFinite(item.change.ratio) ||
        item.change.ratio < 0 ||
        item.change.ratio > 1 ||
        !Number.isInteger(item.change.changed) ||
        !Number.isInteger(item.change.removed) ||
        !Number.isInteger(item.change.total))
    )
      invalidIndex()
  }
  const active = new Set(
    value.snapshots.map((item: WebdavSnapshot) => item.file)
  )
  if (
    !value.garbage.every(
      (file: unknown) =>
        typeof file === "string" && snapshotFile.test(file) && !active.has(file)
    )
  )
    invalidIndex()
  return value
}
