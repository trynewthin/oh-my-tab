import { replaceData, flushStorage } from "@/lib/storage"
import { useOnboardingStore } from "@/stores/onboarding-store"
import {
  useGardenStore,
  validSharedGarden,
  migrateGarden,
} from "@/stores/garden-store"
import { GRID_COLUMNS, itemWidth } from "@/lib/grid/grid-layout"
import { isMatrixPet } from "@/lib/matrix-pets"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { validGridItem } from "@/lib/grid/validation"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { isSearchUrl, defaultSearchEngines } from "@/lib/search-engines"
import { MOCK_DATA_VERSION } from "@/lib/grid/mock-version"
import { decodeConfig } from "@/lib/config-codec"
import { isBackgroundPaletteId } from "@/lib/background-palettes"
import { i18n } from "@/i18n"

export function snapshot() {
  const home = useHomeSettingsStore.getState()
  const search = useSearchEngineStore.getState()
  const grid = useTabGridStore.getState()
  return {
    version: 1,
    onboarding: { seen: useOnboardingStore.getState().seen },
    garden: useGardenStore.getState(),
    home: {
      gridMode: home.gridMode,
      backgroundType: home.backgroundType,
      backgroundImage: home.backgroundImage,
      backgroundPalette: home.backgroundPalette,
      searchBoxStyle: home.searchBoxStyle,
      folderStyle: home.folderStyle,
      tabTexture: home.tabTexture,
      topComponent: home.topComponent,
      content: home.content,
      text: home.text,
      pet: home.pet,
      color: home.color,
      burningAmplitude: home.burningAmplitude,
      transitionsEnabled: home.transitionsEnabled,
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

export async function parseConfig(text: string): Promise<Config> {
  return validateConfig(await decodeConfig(text))
}

export function validateConfig(value: unknown): Config {
  if (!value || typeof value !== "object")
    throw new Error(i18n.t("settings.errors.invalidContent"))
  const config = value as Config
  const { home, theme, search, grid } = config
  const hex = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)
  if (
    config.version !== 1 ||
    (config.onboarding !== undefined &&
      (!config.onboarding || typeof config.onboarding.seen !== "boolean")) ||
    (config.garden !== undefined && !validSharedGarden(config.garden)) ||
    !home ||
    !theme ||
    !search ||
    !grid ||
    (home.backgroundType !== undefined &&
      !["solid", "image", "explore"].includes(home.backgroundType)) ||
    (home.gridMode !== undefined &&
      !["dynamic", "static"].includes(home.gridMode)) ||
    (home.backgroundImage !== undefined &&
      home.backgroundImage !== null &&
      (typeof home.backgroundImage !== "string" ||
        home.backgroundImage.length > 2_000_000 ||
        !/^data:image\/(?:png|jpeg|webp);base64,/i.test(
          home.backgroundImage
        ))) ||
    (home.backgroundPalette !== undefined &&
      !isBackgroundPaletteId(home.backgroundPalette)) ||
    (home.searchBoxStyle !== undefined &&
      !["full", "minimal"].includes(home.searchBoxStyle)) ||
    (home.folderStyle !== undefined &&
      !["classic", "noise", "none"].includes(home.folderStyle)) ||
    (home.tabTexture !== undefined &&
      !["none", "burning", "particles"].includes(home.tabTexture)) ||
    !["none", "dot-matrix"].includes(home.topComponent) ||
    !["time", "text", "pet", "breathing"].includes(home.content) ||
    typeof home.text !== "string" ||
    home.text.length > 80 ||
    !hex(home.color) ||
    (home.tabTexture !== undefined &&
      !["none", "burning", "particles"].includes(home.tabTexture)) ||
    (home.burningAmplitude !== undefined &&
      (!Number.isFinite(home.burningAmplitude) ||
        home.burningAmplitude < 0 ||
        home.burningAmplitude > 2)) ||
    (home.transitionsEnabled !== undefined &&
      typeof home.transitionsEnabled !== "boolean") ||
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
    (search.openInNewTab !== undefined &&
      typeof search.openInNewTab !== "boolean") ||
    new Set(search.engines.map((e) => e.id)).size !== search.engines.length ||
    !Array.isArray(grid.items) ||
    !grid.items.every(validGridItem) ||
    !grid.layouts ||
    typeof grid.layouts !== "object" ||
    Array.isArray(grid.layouts)
  )
    throw new Error(i18n.t("settings.errors.invalidContentOrSettings"))
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
  // Older exports carried the material as `effectStyle`; fold it into
  // tabTexture when the new key is absent.
  const legacyTexture = (home as { effectStyle?: string }).effectStyle
  home.tabTexture ??=
    legacyTexture === "none" || legacyTexture === "particles"
      ? legacyTexture
      : "burning"
  home.backgroundType ??= "solid"
  home.gridMode ??= "dynamic"
  if ((home as { backgroundType?: string }).backgroundType === "explore")
    home.backgroundType = "solid"
  home.backgroundImage ??= null
  home.backgroundPalette ??= "gray"
  home.searchBoxStyle ??= "full"
  home.folderStyle ??= "noise"
  home.burningAmplitude ??= 1
  home.transitionsEnabled ??=
    (home as { burningEntrance?: unknown }).burningEntrance === true
  search.openInNewTab ??= true
  home.text = home.text.replace(/[^\x20-\x7e]/g, "")
  grid.mockDataVersion = MOCK_DATA_VERSION
  return config
}

export async function importConfig(
  config: Config,
  revision: string | undefined
) {
  const entries = [
    ["omt.home-settings", config.home],
    ["omt.theme-mode", config.theme],
    ["omt.onboarding", config.onboarding ?? { seen: true }],
    ["omt.search-engines", config.search],
    ["omt.tab-grid", config.grid],
    [
      "omt.garden",
      config.garden ?? migrateGarden(config.grid.items, Date.now()),
    ],
  ] as const
  await flushStorage()
  await replaceData(
    Object.fromEntries(
      entries.map(([key, state]) => [
        key,
        JSON.stringify({ state, version: 0 }),
      ])
    ),
    revision
  )
}
