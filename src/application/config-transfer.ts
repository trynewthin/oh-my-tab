import { CONFIG_VERSION, STORAGE_VERSION } from "@/lib/data-version"
import { migrateConfig } from "@/lib/migrations/v2"
import { replaceData, flushStorage } from "@/lib/storage"
import { useOnboardingStore } from "@/stores/onboarding-store"
import { useGardenStore, validSharedGarden } from "@/stores/garden-store"
import {
  clampGridScale,
  GRID_COLUMNS,
  isGridComponentColumnCount,
  itemWidth,
} from "@/lib/grid/grid-layout"
import { isMatrixPet } from "@/lib/matrix-pets"
import {
  MAX_TAB_EFFECT_COVERAGE,
  MIN_TAB_EFFECT_COVERAGE,
  useHomeSettingsStore,
} from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { validGridItem } from "@/lib/grid/validation"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { isSearchUrl, defaultSearchEngines } from "@/lib/search-engines"
import { isBackgroundPaletteId } from "@/lib/background-palettes"
import { isTraditionalTopSpacing } from "@/lib/home-top-spacing"
import { validSearchShortcuts } from "@/lib/search-shortcuts"
import { validQuickBarConfig } from "@/lib/quick-bar"
import { sanitizeTabAppearance, validTabAppearance } from "@/lib/tab-appearance"
import { i18n } from "@/i18n"
import { sanitizeFolderBorder, validFolderBorder } from "@/lib/folder-border"
import {
  MAX_FOLDER_RADIUS,
  DEFAULT_TAB_EFFECT_COVERAGE,
} from "@/lib/home-settings"
import { sanitizeSquareTabAppearance } from "@/lib/tab-appearance"

export function snapshot() {
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
export type Config = ReturnType<typeof snapshot>

export function validateConfig(value: unknown): Config {
  if (!value || typeof value !== "object")
    throw new Error(i18n.t("settings.errors.invalidContent"))
  const config = migrateConfig(value) as Config
  const { home, theme, search, grid } = config
  const hex = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)
  if (
    config.version !== CONFIG_VERSION ||
    !config.onboarding ||
    typeof config.onboarding.seen !== "boolean" ||
    !validSharedGarden(config.garden) ||
    !home ||
    !theme ||
    !search ||
    !grid ||
    !["traditional", "free"].includes(home.layoutMode) ||
    !validQuickBarConfig(home.quickBar) ||
    !["solid", "image"].includes(home.backgroundType) ||
    !isGridComponentColumnCount(home.wideGridColumns) ||
    !isGridComponentColumnCount(home.narrowGridColumns) ||
    (isGridComponentColumnCount(home.wideGridColumns) &&
      isGridComponentColumnCount(home.narrowGridColumns) &&
      home.narrowGridColumns > home.wideGridColumns) ||
    clampGridScale(home.gridScale) === null ||
    (home.backgroundImage !== null &&
      (typeof home.backgroundImage !== "string" ||
        home.backgroundImage.length > 2_000_000 ||
        !/^data:image\/(?:png|jpeg|webp);base64,/i.test(
          home.backgroundImage
        ))) ||
    !isBackgroundPaletteId(home.backgroundPalette) ||
    !["full", "minimal"].includes(home.searchBoxStyle) ||
    !validSearchShortcuts(home.searchShortcuts) ||
    !isTraditionalTopSpacing(home.traditionalTopSpacing) ||
    !["classic", "noise", "none"].includes(home.folderStyle) ||
    (home.folderRadius !== undefined &&
      (typeof home.folderRadius !== "number" ||
        !Number.isFinite(home.folderRadius) ||
        home.folderRadius < 0 ||
        home.folderRadius > MAX_FOLDER_RADIUS)) ||
    (home.folderBorder !== undefined &&
      !validFolderBorder(home.folderBorder)) ||
    !["none", "burning", "particles"].includes(home.tabTexture) ||
    !Number.isFinite(home.tabEffectCoverage) ||
    home.tabEffectCoverage < MIN_TAB_EFFECT_COVERAGE ||
    home.tabEffectCoverage > MAX_TAB_EFFECT_COVERAGE ||
    typeof home.newTabsDynamicEffect !== "boolean" ||
    !["none", "dot-matrix"].includes(home.topComponent) ||
    !["time", "text", "pet", "breathing"].includes(home.content) ||
    typeof home.text !== "string" ||
    home.text.length > 80 ||
    !hex(home.color) ||
    !["none", "burning", "particles"].includes(home.tabTexture) ||
    !Number.isFinite(home.burningAmplitude) ||
    home.burningAmplitude < 0 ||
    home.burningAmplitude > 2 ||
    typeof home.transitionsEnabled !== "boolean" ||
    (home.tabAppearance !== undefined &&
      !validTabAppearance(home.tabAppearance)) ||
    (home.squareTabAppearance !== undefined &&
      !validTabAppearance(home.squareTabAppearance)) ||
    (home.squareTabTexture !== undefined &&
      !["none", "burning", "particles"].includes(home.squareTabTexture)) ||
    (home.squareTabEffectCoverage !== undefined &&
      (!Number.isFinite(home.squareTabEffectCoverage) ||
        home.squareTabEffectCoverage < MIN_TAB_EFFECT_COVERAGE ||
        home.squareTabEffectCoverage > MAX_TAB_EFFECT_COVERAGE)) ||
    !isMatrixPet(home.pet) ||
    !["light", "dark", "system"].includes(theme.theme) ||
    !Array.isArray(search.engines) ||
    !search.engines.length ||
    !search.engines.every(
      (e) =>
        e &&
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        typeof e.url === "string" &&
        isSearchUrl(e.url) &&
        (e.icon === undefined ||
          defaultSearchEngines.some((p) => p.icon === e.icon))
    ) ||
    !search.engines.some((e) => e.id === search.selectedId) ||
    typeof search.openInNewTab !== "boolean" ||
    new Set(search.engines.map((e) => e.id)).size !== search.engines.length ||
    !Array.isArray(grid.items) ||
    !grid.items.every(validGridItem) ||
    !grid.layouts ||
    typeof grid.layouts !== "object" ||
    Array.isArray(grid.layouts)
  )
    throw new Error(i18n.t("settings.errors.invalidContentOrSettings"))
  home.tabAppearance = sanitizeTabAppearance({
    ...home.tabAppearance,
    radius: home.tabAppearance?.radius ?? home.folderRadius,
  })
  home.squareTabAppearance = {
    ...sanitizeSquareTabAppearance(home.squareTabAppearance),
    radius: home.tabAppearance.radius,
  }
  home.squareTabTexture ??= "burning"
  home.squareTabEffectCoverage ??= DEFAULT_TAB_EFFECT_COVERAGE
  home.folderBorder = sanitizeFolderBorder(home.folderBorder)
  home.folderRadius = home.tabAppearance.radius
  const ids = grid.items.flatMap((item) =>
    item.kind === "folder"
      ? [item.id, ...item.tabs.map((t) => t.id)]
      : [item.id]
  )
  if (new Set(ids).size !== ids.length)
    throw new Error(i18n.t("settings.errors.duplicateIds"))
  for (const [columns, positions] of Object.entries(grid.layouts)) {
    if (
      !GRID_COLUMNS.some((value) => String(value) === columns) ||
      !positions ||
      typeof positions !== "object" ||
      !Object.entries(positions).every(
        ([id, p]) =>
          p &&
          Number.isInteger(p.x) &&
          Number.isInteger(p.y) &&
          p.x >= 0 &&
          p.x <=
            Number(columns) -
              (grid.items.find((item) => item.id === id)
                ? itemWidth(
                    grid.items.find((item) => item.id === id)!,
                    Number(columns)
                  )
                : 4) &&
          p.y >= 0 &&
          p.y <= 500
      )
    )
      throw new Error(i18n.t("settings.errors.invalidGrid"))
  }
  home.text = home.text.replace(/[^\x20-\x7e]/g, "")
  return config
}

export async function importConfig(
  config: Config,
  revision: string | undefined
) {
  const entries = [
    ["omt.home-settings", config.home],
    ["omt.theme-mode", config.theme],
    ["omt.onboarding", config.onboarding],
    ["omt.search-engines", config.search],
    ["omt.tab-grid", config.grid],
    ["omt.garden", config.garden],
  ] as const
  await flushStorage()
  await replaceData(
    Object.fromEntries(
      entries.map(([key, state]) => [
        key,
        JSON.stringify({ state, version: STORAGE_VERSION }),
      ])
    ),
    revision
  )
}
