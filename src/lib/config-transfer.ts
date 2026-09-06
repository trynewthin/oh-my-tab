import {
  useGardenStore,
  validSharedGarden,
  migrateGarden,
} from "@/stores/garden-store"
import { GRID_COLUMNS } from "@/components/tab-grid/grid-layout"
import { isMatrixPet } from "@/components/dot-matrix/pet-catalog"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore, validItem } from "@/stores/tab-grid-store"
import { isSearchUrl, defaultSearchEngines } from "@/lib/search-engines"
import { MOCK_DATA_VERSION } from "@/components/tab-grid/mock-data"
import { encodeConfig, decodeConfig } from "./config-codec"

function snapshot() {
  const home = useHomeSettingsStore.getState()
  const search = useSearchEngineStore.getState()
  const grid = useTabGridStore.getState()
  return {
    version: 1,
    garden: useGardenStore.getState(),
    home: {
      topComponent: home.topComponent,
      content: home.content,
      text: home.text,
      pet: home.pet,
      color: home.color,
      burningAmplitude: home.burningAmplitude,
      effectStyle: home.effectStyle,
      transitionsEnabled: home.transitionsEnabled,
    },
    theme: { theme: useThemeStore.getState().theme },
    search: { engines: search.engines, selectedId: search.selectedId },
    grid: {
      items: grid.items,
      layouts: grid.layouts,
      mockDataVersion: grid.mockDataVersion,
    },
  }
}
export type Config = ReturnType<typeof snapshot>
export const exportConfig = () => encodeConfig(snapshot())

export async function parseConfig(text: string): Promise<Config> {
  const value = await decodeConfig(text)
  if (!value || typeof value !== "object") throw new Error("配置内容无效")
  const config = value as Config
  const { home, theme, search, grid } = config
  const hex = (v: unknown) => typeof v === "string" && /^#[0-9a-f]{6}$/i.test(v)
  if (
    config.version !== 1 ||
    (config.garden !== undefined && !validSharedGarden(config.garden)) ||
    !home ||
    !theme ||
    !search ||
    !grid ||
    !["none", "dot-matrix"].includes(home.topComponent) ||
    !["time", "text", "pet", "breathing"].includes(home.content) ||
    typeof home.text !== "string" ||
    home.text.length > 80 ||
    !hex(home.color) ||
    (home.effectStyle !== undefined &&
      !["burning", "particles"].includes(home.effectStyle)) ||
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
    new Set(search.engines.map((e) => e.id)).size !== search.engines.length ||
    !Array.isArray(grid.items) ||
    !grid.items.every(validItem) ||
    !grid.layouts ||
    typeof grid.layouts !== "object" ||
    Array.isArray(grid.layouts)
  )
    throw new Error("配置内容无效或缺少必要设置")
  const ids = grid.items.flatMap((item) =>
    item.kind === "folder"
      ? [item.id, ...item.tabs.map((t) => t.id)]
      : [item.id]
  )
  if (new Set(ids).size !== ids.length) throw new Error("标签或文件夹标识重复")
  for (const [columns, positions] of Object.entries(grid.layouts)) {
    if (
      !GRID_COLUMNS.some((value) => String(value) === columns) ||
      !positions ||
      typeof positions !== "object" ||
      !Object.values(positions).every(
        (p) =>
          p &&
          Number.isInteger(p.x) &&
          Number.isInteger(p.y) &&
          p.x >= 0 &&
          p.x <= Number(columns) - 4 &&
          p.y >= 0 &&
          p.y <= 500
      )
    )
      throw new Error("网格布局无效")
  }
  home.effectStyle ??= "burning"
  home.burningAmplitude ??= 1
  home.transitionsEnabled ??=
    (home as { burningEntrance?: unknown }).burningEntrance === true
  home.text = home.text.replace(/[^\x20-\x7e]/g, "")
  grid.mockDataVersion = MOCK_DATA_VERSION
  return config
}

export function importConfig(config: Config) {
  const entries = [
    ["omt.home-settings", config.home],
    ["omt.theme-mode", config.theme],
    ["omt.search-engines", config.search],
    ["omt.tab-grid", config.grid],
    [
      "omt.garden",
      config.garden ?? migrateGarden(config.grid.items, Date.now()),
    ],
  ] as const
  const previous = entries.map(
    ([key]) => [key, localStorage.getItem(key)] as const
  )
  try {
    for (const [key, state] of entries)
      localStorage.setItem(key, JSON.stringify({ state, version: 0 }))
  } catch {
    for (const [key, value] of previous) {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, value)
    }
    throw new Error("保存失败，请检查浏览器存储空间")
  }
}
