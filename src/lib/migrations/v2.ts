import { CONFIG_VERSION } from "@/lib/data-version"
import {
  DEFAULT_GRID_SCALE,
  DEFAULT_NARROW_GRID_COLUMNS,
  DEFAULT_WIDE_GRID_COLUMNS,
} from "@/lib/grid/grid-layout"
import {
  DEFAULT_TAB_EFFECT_COVERAGE,
  DEFAULT_FOLDER_RADIUS,
} from "@/lib/home-settings"
import { defaultQuickBar } from "@/lib/quick-bar"
import { defaultSearchShortcuts } from "@/lib/search-shortcuts"
import { defaultTraditionalTopSpacing } from "@/lib/home-top-spacing"
import { sanitizeTabAppearance } from "@/lib/tab-appearance"
import { DEFAULT_FOLDER_BORDER } from "@/lib/folder-border"
import { MOCK_DATA_VERSION } from "@/lib/grid/mock-version"
import { validGridItem } from "@/lib/grid/validation"
import { migrateDotCanvas } from "./dot-canvas"
import { migrateGarden } from "./garden"
import { dropRemovedGridItems } from "./removed-items"
import { i18n } from "@/i18n"

export function record(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

export function migrateHome(value: unknown) {
  const home = { ...record(value) }
  home.tabTexture ??=
    home.effectStyle === "none" || home.effectStyle === "particles"
      ? home.effectStyle
      : "burning"
  home.backgroundType ??= "solid"
  if (home.backgroundType === "explore") home.backgroundType = "solid"
  home.layoutMode ??= "traditional"
  home.quickBar ??= defaultQuickBar()
  home.gridScale ??= DEFAULT_GRID_SCALE
  home.wideGridColumns ??= DEFAULT_WIDE_GRID_COLUMNS
  home.narrowGridColumns ??= Math.min(
    DEFAULT_NARROW_GRID_COLUMNS,
    Number(home.wideGridColumns)
  )
  home.backgroundImage ??= null
  home.backgroundPalette ??= "gray"
  home.searchBoxStyle ??= "full"
  home.searchShortcuts ??= defaultSearchShortcuts()
  home.traditionalTopSpacing ??= defaultTraditionalTopSpacing
  home.folderStyle ??= "noise"
  home.folderRadius ??= DEFAULT_FOLDER_RADIUS
  home.folderBorder ??= { ...DEFAULT_FOLDER_BORDER }
  home.tabEffectCoverage ??= DEFAULT_TAB_EFFECT_COVERAGE
  home.tabAppearance = sanitizeTabAppearance(home.tabAppearance)
  home.newTabsDynamicEffect ??= false
  home.burningAmplitude ??= 1
  home.transitionsEnabled ??= home.burningEntrance === true
  delete home.effectStyle
  delete home.burningEntrance
  delete home.gridMode
  return home
}
function migratePlant(value: unknown) {
  const plant = { ...record(value) }
  if (plant.name === "未命名植物") delete plant.name
  if (typeof plant.plantedAt === "number" && typeof plant.slot === "number")
    plant.seed ??= (Math.floor(plant.plantedAt) + plant.slot * 997) >>> 0
  if (plant.appearance === undefined) {
    if (plant.appearanceVersion !== undefined && plant.appearanceVersion !== 2)
      throw new Error(i18n.t("grid.error.corruptGrid"))
    plant.appearance = plant.appearanceVersion === 2 ? "varied" : "classic"
  }
  delete plant.appearanceVersion
  return plant
}
export function migrateGrid(value: unknown) {
  const grid = structuredClone(record(value))
  if (!Array.isArray(grid.items)) return grid
  const retained = dropRemovedGridItems(grid.items)
  const ids = new Set(retained.items.map((value) => record(value).id))
  grid.items = retained.items.flatMap((value) => {
    const item = record(value)
    if (item.kind === "countdown") {
      if (item.size === "large") item.size = "small"
      if (item.size === "medium") item.size = "wide"
    }
    if (
      item.kind === "countdown" &&
      item.event === undefined &&
      Array.isArray(item.events)
    ) {
      const events = item.events
      delete item.events
      if (events.length === 0) return [{ ...item, event: null }]
      // Each event gets a card; the first keeps the saved ID and position.
      return events.map((event, index) => {
        let id = item.id
        if (index > 0) {
          const base = `${item.id}:countdown:${index}`
          id = base
          let suffix = 1
          while (ids.has(id)) id = `${base}:${suffix++}`
          ids.add(id)
        }
        const { title, date } = record(event)
        return { ...item, id, event: { title, date } }
      })
    }
    if (item.kind === "ecosystem" && Array.isArray(item.plants)) {
      item.plants = item.plants.map(migratePlant)
      if (Array.isArray(item.album)) item.album = item.album.map(migratePlant)
    }
    if (item.kind === "dot-canvas") migrateDotCanvas(item)
    if (item.kind === "pomodoro") {
      item.breakMinutes ??= 0
      item.loop ??= false
      item.phase ??= "focus"
    }
    return [item]
  })
  for (const positions of Object.values(record(grid.layouts)))
    for (const id of retained.removedIds) delete record(positions)[id]
  return grid
}
export function migrateGardenData(
  grid: Record<string, unknown>,
  value: unknown,
  now: number
) {
  const items = Array.isArray(grid.items) ? grid.items : []
  if (!items.every(validGridItem))
    throw new Error(i18n.t("grid.error.corruptGrid"))
  const garden =
    value && record(value).initialized !== false
      ? { ...record(value) }
      : { ...migrateGarden(items, now) }
  if (Array.isArray(garden.album)) garden.album = garden.album.map(migratePlant)
  for (const item of items) {
    if (item.kind !== "ecosystem") continue
    delete item.album
    delete item.points
    delete item.pointsUpdatedAt
    delete item.lastCheckIn
  }
  return garden
}

// Each imported file is a fresh source: it stays untouched, and only the
// converted configuration enters active storage.
export function migrateConfig(value: unknown, now = Date.now()): unknown {
  const source = record(value)
  if (source.version === CONFIG_VERSION) return structuredClone(value)
  if (![1, 2, 3].includes(source.version as number))
    throw new Error(i18n.t("settings.errors.invalidContentOrSettings"))
  const config = structuredClone(source)
  config.home = migrateHome(config.home)
  config.search = {
    ...record(config.search),
    openInNewTab: record(config.search).openInNewTab ?? true,
  }
  config.grid = migrateGrid(config.grid)
  const grid = record(config.grid)
  config.garden = migrateGardenData(grid, config.garden, now)
  config.onboarding ??= { seen: true }
  grid.mockDataVersion = MOCK_DATA_VERSION
  config.version = CONFIG_VERSION
  return config
}
