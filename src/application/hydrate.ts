import { migrateStoredData } from "@/lib/migrations/storage"
import { seedDemoData } from "@/application/demo-data"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useGardenStore } from "@/stores/garden-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { usePrivacyStore } from "@/stores/privacy-store"
import { useLocaleStore } from "@/stores/locale-store"
import {
  drainReadIssues,
  flushStorage,
  initializeStorage,
  readEntries,
  subscribeStorage,
} from "@/lib/storage"
import { appendMigrationReport } from "@/lib/migration-report"
import { i18n } from "@/i18n"
import { toast } from "@/stores/toast-store"
import { workspace } from "@/application/workspace"
import { documentKeys, DATA_KEYS, DEVICE_KEYS } from "@/lib/data/keys"
const stores = [
  usePrivacyStore,
  useHomeSettingsStore,
  useThemeStore,
  useSearchEngineStore,
  useTabGridStore,
  useGardenStore,
  useOnboardingStore,
  useLocaleStore,
]
async function rehydrateStores(keys?: ReadonlySet<string>) {
  for (const store of stores) {
    const controller = "projection" in store ? store.projection : store.persist
    if (keys && !keys.has(controller.getOptions().name ?? "")) continue
    await controller.rehydrate()
    if (!controller.hasHydrated())
      throw new Error(
        `${i18n.t("core.hydrate.readFailed")} [rehydrate: ${controller.getOptions().name}]`
      )
  }
}

let rehydrateTail: Promise<void> = Promise.resolve()
// undefined: nothing queued · "all": every store · Set: queued storage keys
let rehydratePending: Set<string> | "all" | undefined

// Serialize rehydration: zustand resolves superseded calls before hasHydrated
// becomes true, so overlapping passes would fail the check above.
export function rehydrateData(keys?: string[]): Promise<void> {
  rehydratePending =
    rehydratePending === "all" || keys === undefined
      ? "all"
      : rehydratePending === undefined
        ? new Set(keys)
        : new Set([...rehydratePending, ...keys])
  const run = rehydrateTail.then(async () => {
    const pending = rehydratePending
    rehydratePending = undefined
    if (pending === undefined) return // drained by the previous run
    try {
      await flushStorage()
    } catch {
      /* Re-read committed data after a failed write. */
    }
    await migrateStoredData()
    await rehydrateStores(pending === "all" ? undefined : pending)
    const issues = drainReadIssues()
    if (issues.length)
      await appendMigrationReport(
        issues.map((issue) => ({
          key: issue.key,
          reason: issue.message ?? issue.reason,
          partial: issue.reason === "partial",
        }))
      ).catch(() => {})
  })
  rehydrateTail = run.catch(() => {})
  return run
}
export async function prepareData() {
  await navigator.locks.request("omt-startup", async () => {
    let stage = "initializeStorage"
    try {
      await initializeStorage()
      const fresh =
        Object.values(await readEntries(DATA_KEYS)).every(
          (value) => value === undefined
        ) && DATA_KEYS.every((key) => localStorage.getItem(key) === null)
      await migrateStoredData()
      const created = await workspace.initialize()
      stage = "rehydrateData"
      await rehydrateData()
      if (import.meta.env.DEV) {
        stage = "seedDemoData"
        await seedDemoData(fresh && created.includes("grid"))
      }
      stage = "flushStorage"
      await flushStorage()
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : String(cause)
      throw new Error(`[${stage}] ${detail}`, { cause })
    }
  })
  const unsubscribe = subscribeStorage((keys) => {
    const deviceKeys = keys.filter((key) =>
      (DEVICE_KEYS as readonly string[]).includes(key)
    )
    if (!deviceKeys.length) return
    void rehydrateData(deviceKeys).catch(() =>
      toast(i18n.t("core.hydrate.updateFailed"), "error")
    )
  })
  const unsubscribeWorkspace = workspace.subscribe((sections) => {
    void rehydrateData(sections.map((section) => documentKeys[section])).catch(
      () => toast(i18n.t("core.hydrate.updateFailed"), "error")
    )
  })
  const onError = (event: Event) =>
    toast(
      (event as CustomEvent<string>).detail ||
        i18n.t("core.storage.persistFailed"),
      "error"
    )
  window.addEventListener("omt-storage-error", onError)
  const refresh = () => {
    if (document.visibilityState === "hidden") return
    void initializeStorage()
      .then(() => rehydrateData())
      .catch(() => toast(i18n.t("core.hydrate.updateFailed"), "error"))
  }
  window.addEventListener("focus", refresh)
  window.addEventListener("pageshow", refresh)
  document.addEventListener("visibilitychange", refresh)
  return () => {
    unsubscribe()
    unsubscribeWorkspace()
    window.removeEventListener("omt-storage-error", onError)
    window.removeEventListener("focus", refresh)
    window.removeEventListener("pageshow", refresh)
    document.removeEventListener("visibilitychange", refresh)
  }
}
