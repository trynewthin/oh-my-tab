import { i18n } from "@/i18n"
import { readEntries, writeEntries } from "@/lib/storage"
import {
  DEFAULT_SNAPSHOT_LIMIT,
  validSnapshotLimit,
  type SyncBaseline,
} from "@/lib/webdav-sync"
import { normalizeWebdav, testWebdav, type WebdavConnection } from "./webdav"

export const WEBDAV_KEY = "omt.webdav"
export type SavedWebdav = WebdavConnection & {
  deviceId: string
  snapshotLimit: number
  connectedAt: number
  baseline?: SyncBaseline
  lastSyncAt?: number
}
export function parseWebdavSettings(raw: unknown): {
  connection: WebdavConnection
  saved: SavedWebdav | null
} | null {
  if (raw == null) return null
  if (typeof raw !== "string")
    throw new Error(i18n.t("settings.data.loadFailed"))
  const value = JSON.parse(raw)
  if (
    !value ||
    typeof value.url !== "string" ||
    typeof value.username !== "string"
  )
    throw new Error(i18n.t("settings.data.loadFailed"))
  const connection = {
    ...normalizeWebdav(value),
    password: typeof value.password === "string" ? value.password : "",
  }
  // Previous versions stored only the address and username. Preserve them as
  // form defaults; a password must be supplied once before saving a connection.
  if (typeof value.password !== "string" || typeof value.deviceId !== "string")
    return { connection, saved: null }
  const saved: SavedWebdav = {
    ...connection,
    deviceId: value.deviceId,
    snapshotLimit: validSnapshotLimit(value.snapshotLimit)
      ? value.snapshotLimit
      : DEFAULT_SNAPSHOT_LIMIT,
    connectedAt: Number.isFinite(value.connectedAt) ? value.connectedAt : 0,
  }
  if (
    typeof value.baseline?.localHash === "string" &&
    typeof value.baseline?.remoteId === "string"
  )
    saved.baseline = value.baseline
  if (Number.isFinite(value.lastSyncAt)) saved.lastSyncAt = value.lastSyncAt
  return { connection, saved }
}
export async function readWebdavSettings() {
  const raw = (await readEntries([WEBDAV_KEY]))[WEBDAV_KEY]
  return { raw, ...parseWebdavSettings(raw) }
}
export async function saveWebdavSettings(
  connection: WebdavConnection,
  snapshotLimit: number
) {
  if (!validSnapshotLimit(snapshotLimit))
    throw new Error(i18n.t("settings.webdav.invalidSnapshotLimit"))
  return navigator.locks.request("omt-webdav", async () => {
    const previous = await readWebdavSettings()
    await testWebdav(connection)
    const normalized = {
      ...normalizeWebdav(connection),
      password: connection.password,
    }
    const same =
      previous.saved?.url === normalized.url &&
      previous.saved?.username === normalized.username
    const saved: SavedWebdav = {
      ...normalized,
      deviceId: previous.saved?.deviceId ?? crypto.randomUUID(),
      snapshotLimit,
      connectedAt: Date.now(),
      ...(same
        ? {
            baseline: previous.saved?.baseline,
            lastSyncAt: previous.saved?.lastSyncAt,
          }
        : {}),
    }
    await writeEntries({ [WEBDAV_KEY]: JSON.stringify(saved) }, true, {
      [WEBDAV_KEY]: previous.raw,
    })
    return saved
  })
}
export async function removeWebdavSettings() {
  await navigator.locks.request("omt-webdav", () =>
    writeEntries({ [WEBDAV_KEY]: null })
  )
}
