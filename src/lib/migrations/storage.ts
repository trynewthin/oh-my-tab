import { migrateWebdavSettings } from "./webdav-settings"
import { STORAGE_VERSION } from "@/lib/data-version"
import {
  DATA_KEYS,
  DEVICE_KEYS,
  readEntries,
  writeEntries,
  chromeStorage,
  blobToDataUrl,
  dataUrlToBlob,
  allEntries,
} from "@/lib/storage"
import { sanitizeHomeSettings } from "@/lib/home-settings"
import { sanitizePersisted } from "@/lib/grid/persisted"
import { validSharedGarden } from "@/lib/shared-garden"
import { i18n } from "@/i18n"
import { migrateHome, migrateGrid, migrateGardenData, record } from "./v2"

const MARKER = "omt.migrations"
const PERSIST_KEYS = [...DATA_KEYS, "omt.privacy", "omt.locale"]

export async function migrateStoredData() {
  await navigator.locks.request("omt-migrations", async () => {
    const keys = [...DATA_KEYS, ...DEVICE_KEYS, MARKER]
    const current = await readEntries(keys)
    if (current[MARKER] === STORAGE_VERSION) return
    if (
      typeof current[MARKER] === "number" &&
      current[MARKER] > STORAGE_VERSION
    )
      throw new Error(i18n.t("core.hydrate.readFailed"))
    const updates: Record<string, unknown> = {}
    const source = { ...current }
    const legacyKeys: string[] = []
    for (const key of [...DATA_KEYS, ...DEVICE_KEYS]) {
      const old = localStorage.getItem(key)
      if (old === null) continue
      legacyKeys.push(key)
      if (source[key] === undefined) {
        let value = old
        if (key === "omt.sync-provider") {
          value = old === "local" || old === "webdav" ? old : JSON.parse(old)
          if (value !== "local" && value !== "webdav")
            throw new Error(i18n.t("core.hydrate.readFailed"))
        } else JSON.parse(old)
        source[key] = value
        updates[key] = value
      }
    }
    const webdav = migrateWebdavSettings(source["omt.webdav"])
    if (webdav !== current["omt.webdav"]) updates["omt.webdav"] = webdav
    const states = new Map<string, Record<string, unknown>>()
    for (const key of PERSIST_KEYS) {
      if (source[key] == null) continue
      if (typeof source[key] !== "string")
        throw new Error(i18n.t("core.hydrate.readFailed"))
      const envelope = JSON.parse(source[key])
      const version = envelope?.version ?? 0
      if (
        !Number.isInteger(version) ||
        version < 0 ||
        version > STORAGE_VERSION ||
        !envelope?.state ||
        typeof envelope.state !== "object" ||
        Array.isArray(envelope.state)
      )
        throw new Error(i18n.t("core.hydrate.readFailed"))
      if (version === STORAGE_VERSION) continue
      let state = record(envelope.state)
      if (key === "omt.home-settings")
        state = { ...sanitizeHomeSettings(migrateHome(state)) }
      if (key === "omt.tab-grid") state = migrateGrid(state)
      if (key === "omt.search-engines")
        state = { ...state, openInNewTab: state.openInNewTab ?? true }
      if (key === "omt.privacy")
        state = {
          suggestions: version === 0 ? false : state.suggestions === true,
          icons: state.icons === true,
          browserSearch: state.browserSearch !== false,
        }
      states.set(key, state)
    }
    const grid = states.get("omt.tab-grid")
    const garden = states.get("omt.garden")
    if (grid || garden || source["omt.garden"] == null) {
      const currentGarden =
        source["omt.garden"] == null
          ? undefined
          : JSON.parse(source["omt.garden"] as string).state
      const next = migrateGardenData(
        grid ?? { items: [] },
        garden ?? currentGarden,
        Date.now()
      )
      if (!validSharedGarden(next))
        throw new Error(i18n.t("core.hydrate.readFailed"))
      states.set("omt.garden", next)
    }
    if (grid) states.set("omt.tab-grid", { ...sanitizePersisted(grid) })
    const home = states.get("omt.home-settings")
    if (
      typeof home?.backgroundImage === "string" &&
      home.backgroundImage.startsWith("data:image/")
    ) {
      const blob = dataUrlToBlob(home.backgroundImage)
      const id = `asset:${crypto.randomUUID()}`
      updates[id] = {
        createdAt: Date.now(),
        value: chromeStorage() ? await blobToDataUrl(blob) : blob,
      }
      home.backgroundImage = id
    }
    for (const [key, state] of states)
      updates[key] = JSON.stringify({ state, version: STORAGE_VERSION })
    // Old assets had no metadata wrapper. Rewrite them before getAsset stops
    // accepting the old shape; no bytes are re-encoded on IndexedDB.
    const entries = await allEntries()
    for (const [key, value] of Object.entries(entries)) {
      if (!key.startsWith("asset:") || record(value).value !== undefined)
        continue
      updates[key] = { createdAt: Date.now(), value }
    }
    if (Object.keys(updates).length) await writeEntries(updates, true, current)
    // Cleanup follows a successful commit. If interrupted, retrying uses the
    // committed modern entries and only repeats cleanup.
    for (const key of legacyKeys) localStorage.removeItem(key)
    await writeEntries({ [MARKER]: STORAGE_VERSION }, false, {
      [MARKER]: current[MARKER],
    })
  })
}
