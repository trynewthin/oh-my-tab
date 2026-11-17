import { CONFIG_VERSION } from "@/lib/data-version"
import type { Config } from "@/lib/data/config"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useGardenStore } from "@/stores/garden-store"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore } from "@/stores/tab-grid-store"

// Fixture builder for store/UI tests; production snapshots read the repository.
export function snapshot(): Config {
  const home = useHomeSettingsStore.getState()
  const search = useSearchEngineStore.getState()
  const grid = useTabGridStore.getState()
  return {
    version: CONFIG_VERSION,
    onboarding: { seen: useOnboardingStore.getState().seen },
    garden: useGardenStore.getState(),
    home: {
      layoutMode: home.layoutMode,
      quickBar: home.quickBar,
      wideGridColumns: home.wideGridColumns,
      narrowGridColumns: home.narrowGridColumns,
      gridScale: home.gridScale,
      backgroundType: home.backgroundType,
      backgroundImage: home.backgroundImage,
      backgroundPalette: home.backgroundPalette,
      searchBoxStyle: home.searchBoxStyle,
      searchShortcuts: home.searchShortcuts,
      folderStyle: home.folderStyle,
      folderRadius: home.folderRadius,
      folderBorder: home.folderBorder,
      tabTexture: home.tabTexture,
      tabEffectCoverage: home.tabEffectCoverage,
      newTabsDynamicEffect: home.newTabsDynamicEffect,
      topComponent: home.topComponent,
      traditionalTopSpacing: home.traditionalTopSpacing,
      content: home.content,
      text: home.text,
      pet: home.pet,
      color: home.color,
      burningAmplitude: home.burningAmplitude,
      transitionsEnabled: home.transitionsEnabled,
      tabAppearance: home.tabAppearance,
      squareTabAppearance: home.squareTabAppearance,
      squareTabTexture: home.squareTabTexture,
      squareTabEffectCoverage: home.squareTabEffectCoverage,
    },
    theme: { theme: useThemeStore.getState().theme },
    search: {
      engines: search.engines,
      selectedId: search.selectedId,
      openInNewTab: search.openInNewTab,
    },
    grid: {
      items: grid.items,
      layouts: grid.layouts,
      mockDataVersion: grid.mockDataVersion,
    },
  }
}
