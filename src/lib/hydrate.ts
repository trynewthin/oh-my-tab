import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useGardenStore, initializeGarden } from "@/stores/garden-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { usePrivacyStore } from "@/stores/privacy-store"
import { useLocaleStore } from "@/stores/locale-store"
import {
  flushStorage,
  initializeStorage,
  subscribeStorage,
  putAsset,
  dataUrlToBlob,
} from "./storage"
import { i18n } from "@/i18n"
import { toast } from "@/stores/toast-store"
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
    if (keys && !keys.has(store.persist.getOptions().name ?? "")) continue
    await store.persist.rehydrate()
    if (!store.persist.hasHydrated())
      throw new Error(i18n.t("core.hydrate.readFailed"))
  }
}

let rehydrateTail: Promise<void> = Promise.resolve()
// undefined: nothing queued · "all": every store · Set: queued storage keys
let rehydratePending: Set<string> | "all" | undefined

// Rehydration must run strictly serially: when two rehydrate() calls overlap
// on the same store, zustand resolves the superseded one early and leaves
// hasHydrated false until the newer pass finishes, so the check above is only
// reliable while this queue guarantees no overlap.
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
    await rehydrateStores(pending === "all" ? undefined : pending)
  })
  rehydrateTail = run.catch(() => {})
  return run
}
export async function prepareData() {
  await navigator.locks.request("omt-startup", async () => {
    await initializeStorage()
    await rehydrateData()
    const home = useHomeSettingsStore.getState()
    if (home.backgroundImage?.startsWith("data:image/")) {
      const blob = dataUrlToBlob(home.backgroundImage)
      home.setBackgroundImage(await putAsset(blob))
    }
    initializeGarden(useTabGridStore.getState().items)
    await flushStorage()
  })
  const unsubscribe = subscribeStorage((keys) => {
    void rehydrateData(keys).catch(() =>
      toast(i18n.t("core.hydrate.updateFailed"), "error")
    )
  })
  const onError = (event: Event) =>
    toast(
      (event as CustomEvent<string>).detail ||
        i18n.t("core.storage.persistFailed"),
      "error"
    )
  window.addEventListener("omt-storage-error", onError)
  return () => {
    unsubscribe()
    window.removeEventListener("omt-storage-error", onError)
  }
}
