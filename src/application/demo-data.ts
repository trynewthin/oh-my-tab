import { writeEntries } from "@/lib/storage"
import { DEFAULT_SNAPSHOT_LIMIT } from "@/lib/webdav-sync"
import {
  readWebdavSettings,
  WEBDAV_KEY,
  type SavedWebdav,
} from "@/application/webdav-settings"
import { useGardenStore } from "@/stores/garden-store"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useThemeStore } from "@/stores/theme-store"

/**
 * Restore the complete demo dataset: showcase grid plus factory defaults for
 * every other data store, in one shot. Dev builds only.
 */
export function resetDemoData() {
  if (!import.meta.env.DEV) return
  useTabGridStore.setState(useTabGridStore.getInitialState())
  useHomeSettingsStore.setState(useHomeSettingsStore.getInitialState())
  useThemeStore.setState(useThemeStore.getInitialState())
  useSearchEngineStore.setState(useSearchEngineStore.getInitialState())
  useGardenStore.setState({
    ...useGardenStore.getInitialState(),
    initialized: true,
    pointsUpdatedAt: Date.now(),
  })
  useOnboardingStore.setState({ seen: true, replay: false })
}

/** URL of the dev mock WebDAV server (see scripts/dev/mock-webdav.mjs). */
function mockWebdavUrl() {
  const { hostname, origin } = window.location
  return ["localhost", "127.0.0.1", "[::1]"].includes(hostname)
    ? "http://localhost:8080/"
    : `${origin}/__devin/port/8080/`
}

/**
 * Startup demo seeding (dev builds only): an empty grid restores the full
 * demo dataset, and an unconfigured WebDAV slot is prefilled with a session
 * pointing at the dev mock server so sync is usable without any setup.
 */
export async function seedDemoData() {
  if (!import.meta.env.DEV) return
  if (useTabGridStore.getState().items.length === 0) resetDemoData()
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
