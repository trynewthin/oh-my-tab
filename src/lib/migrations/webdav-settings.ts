import { i18n } from "@/i18n"
import { DEFAULT_SNAPSHOT_LIMIT, validSnapshotLimit } from "@/lib/webdav-sync"
import { readEntries, writeEntries } from "@/lib/storage"
import { record } from "./v2"

export function migrateWebdavSettings(raw: unknown): unknown {
  if (raw == null) return raw
  if (typeof raw !== "string")
    throw new Error(i18n.t("settings.data.loadFailed"))
  const value = record(JSON.parse(raw))
  if (value.version === 2) return raw
  if (
    value.version !== undefined ||
    typeof value.url !== "string" ||
    typeof value.username !== "string"
  )
    throw new Error(i18n.t("settings.data.loadFailed"))
  const connected =
    typeof value.password === "string" && typeof value.deviceId === "string"
  return JSON.stringify(
    connected
      ? {
          ...value,
          version: 2,
          status: "connected",
          snapshotLimit: validSnapshotLimit(value.snapshotLimit)
            ? value.snapshotLimit
            : DEFAULT_SNAPSHOT_LIMIT,
          connectedAt: Number.isFinite(value.connectedAt)
            ? value.connectedAt
            : 0,
        }
      : {
          version: 2,
          status: "draft",
          url: value.url,
          username: value.username,
          password: "",
        }
  )
}
export async function readMigratedWebdavSettings() {
  return navigator.locks.request("omt-webdav-settings-migration", async () => {
    const raw = (await readEntries(["omt.webdav"]))["omt.webdav"]
    const next = migrateWebdavSettings(raw)
    if (next !== raw)
      await writeEntries({ "omt.webdav": next }, true, { "omt.webdav": raw })
    return next
  })
}
