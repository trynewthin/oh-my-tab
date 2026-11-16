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
