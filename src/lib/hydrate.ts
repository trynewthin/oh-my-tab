import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useGardenStore, initializeGarden } from "@/stores/garden-store"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { usePrivacyStore } from "@/stores/privacy-store"
import {
  flushStorage,
  initializeStorage,
  subscribeStorage,
  putAsset,
  dataUrlToBlob,
} from "./storage"
import { toast } from "@/stores/toast-store"
const stores = [
  usePrivacyStore,
  useHomeSettingsStore,
  useThemeStore,
  useSearchEngineStore,
  useTabGridStore,
  useGardenStore,
  useOnboardingStore,
]
export async function rehydrateData(keys?: string[]) {
  for (const store of stores) {
    if (!keys || keys.includes(store.persist.getOptions().name ?? "")) {
      await store.persist.rehydrate()
      if (!store.persist.hasHydrated()) throw new Error("本地数据读取失败")
    }
  }
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
    void (async () => {
      try {
        await flushStorage()
      } catch {
        /* Re-read committed data after a failed write. */
      }
      await rehydrateData(keys)
    })().catch(() => toast("读取更新失败，请重新打开页面", "error"))
  })
  const onError = (event: Event) =>
    toast(
      (event as CustomEvent<string>).detail ||
        "数据保存失败，请检查浏览器存储空间并重试",
      "error"
    )
  window.addEventListener("omt-storage-error", onError)
  return () => {
    unsubscribe()
    window.removeEventListener("omt-storage-error", onError)
  }
}
