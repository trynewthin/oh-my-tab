import { readMigratedWebdavSettings } from "@/lib/migrations/webdav-settings"
import { i18n } from "@/i18n"
import { writeEntries } from "@/lib/storage"
import { validSnapshotLimit, type SyncBaseline } from "@/lib/webdav-sync"
import { normalizeWebdav, testWebdav, type WebdavConnection } from "./webdav"

export const WEBDAV_KEY = "omt.webdav"
export type SavedWebdav = WebdavConnection & {
  version: 2
  status: "connected"
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
    value.version !== 2 ||
    !["draft", "connected"].includes(value.status) ||
    typeof value.password !== "string" ||
    typeof value.url !== "string" ||
    typeof value.username !== "string"
  )
    throw new Error(i18n.t("settings.data.loadFailed"))
  const connection = {
    ...normalizeWebdav(value),
    password: value.password,
  }
  if (value.status === "draft") return { connection, saved: null }
  if (
    typeof value.deviceId !== "string" ||
    !validSnapshotLimit(value.snapshotLimit) ||
    !Number.isFinite(value.connectedAt)
  )
    throw new Error(i18n.t("settings.data.loadFailed"))
  const saved: SavedWebdav = {
    ...connection,
    version: 2,
    status: "connected",
    deviceId: value.deviceId,
    snapshotLimit: value.snapshotLimit,
    connectedAt: value.connectedAt,
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
  const raw = await readMigratedWebdavSettings()
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
      version: 2,
      status: "connected",
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
