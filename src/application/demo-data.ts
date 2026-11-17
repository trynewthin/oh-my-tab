import { writeEntries, flushStorage } from "@/lib/storage"
import { workspace, dataError } from "@/application/workspace"
import { defaultConfig } from "@/lib/data/config"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useGardenStore } from "@/stores/garden-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { DEFAULT_SNAPSHOT_LIMIT } from "@/lib/webdav-sync"
import {
  readWebdavSettings,
  WEBDAV_KEY,
  type SavedWebdav,
} from "@/application/webdav-settings"
import { useTabGridStore } from "@/stores/tab-grid-store"

/**
 * Restore the complete demo dataset: showcase grid plus factory defaults for
 * every other data store, in one shot. Dev builds only.
 */
export async function resetDemoData() {
  if (!import.meta.env.DEV) return
  await flushStorage()
  const { revision } = await workspace.readSections([])
  const config = defaultConfig()
  const initial = useTabGridStore.getInitialState()
  config.grid = {
    items: initial.items,
    layouts: initial.layouts,
    mockDataVersion: initial.mockDataVersion,
  }
  config.onboarding.seen = true
  try {
    await workspace.replace({
      config,
      expectedRevision: revision,
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
    })
    await Promise.all(
      [
        useTabGridStore,
        useHomeSettingsStore,
        useThemeStore,
        useSearchEngineStore,
        useGardenStore,
        useOnboardingStore,
      ].map((store) => store.projection.rehydrate())
    )
  } catch (error) {
    throw dataError(error)
  }
}

/** URL of the dev mock WebDAV server (see scripts/dev/mock-webdav.mjs). */
function mockWebdavUrl() {
  const { hostname, origin } = window.location
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
    ? "http://localhost:8080/"
    : `${origin}/__devin/port/8080/`
}

/**
 * Startup demo seeding (dev builds only): a new workspace gets the full
 * demo dataset, and an unconfigured WebDAV slot is prefilled with a session
 * pointing at the dev mock server so sync is usable without any setup.
 */
export async function seedDemoData(seedGrid: boolean) {
  if (!import.meta.env.DEV) return
  if (seedGrid) await resetDemoData()
  const current = await readWebdavSettings().catch(() => null)
  if (current?.saved || current?.raw != null) return
  const session: SavedWebdav = {
    url: mockWebdavUrl(),
    username: "dev",
    password: "dev",
    version: 2,
    status: "connected",
    deviceId: crypto.randomUUID(),
    snapshotLimit: DEFAULT_SNAPSHOT_LIMIT,
    connectedAt: Date.now(),
  }
  await writeEntries(
    { [WEBDAV_KEY]: JSON.stringify(session), "omt.sync-provider": "webdav" },
    true
  )
}
