import { isMatrixPet, type MatrixPet } from "@/lib/matrix-pets"
import {
  isBackgroundPaletteId,
  type BackgroundPaletteId,
} from "@/lib/background-palettes"
import {
  clampGridScale,
  DEFAULT_GRID_SCALE,
  DEFAULT_NARROW_GRID_COLUMNS,
  DEFAULT_WIDE_GRID_COLUMNS,
  isGridComponentColumnCount,
  type GridComponentColumnCount,
} from "@/lib/grid/grid-layout"
import {
  defaultQuickBar,
  sanitizeQuickBarConfig,
  type QuickBarConfig,
} from "@/lib/quick-bar"
import {
  defaultSearchShortcuts,
  sanitizeSearchShortcuts,
  type SearchShortcutConfig,
} from "@/lib/search-shortcuts"
import {
  defaultTraditionalTopSpacing,
  isTraditionalTopSpacing,
  type TraditionalTopSpacing,
} from "@/lib/home-top-spacing"
import { sanitizeTabAppearance, type TabAppearance } from "@/lib/tab-appearance"

export type TopComponent = "none" | "dot-matrix"
export type MatrixContent = "time" | "text" | "pet" | "breathing"
export type EffectStyle = "none" | "burning" | "particles"
export type FolderStyle = "classic" | "noise" | "none"
export type TabTexture = EffectStyle
export type BackgroundType = "solid" | "image"
export type SearchBoxStyle = "full" | "minimal"
export type HomeLayoutMode = "traditional" | "free"
export const MIN_TAB_EFFECT_COVERAGE = 20
export const MAX_TAB_EFFECT_COVERAGE = 100
export const DEFAULT_TAB_EFFECT_COVERAGE = 65

export type HomeSettings = {
  layoutMode: HomeLayoutMode
  quickBar: QuickBarConfig
  wideGridColumns: GridComponentColumnCount
  narrowGridColumns: GridComponentColumnCount
  gridScale: number
  backgroundType: BackgroundType
  backgroundImage: string | null
  backgroundPalette: BackgroundPaletteId
  searchBoxStyle: SearchBoxStyle
  searchShortcuts: SearchShortcutConfig
  folderStyle: FolderStyle
  tabTexture: TabTexture
  tabEffectCoverage: number
  newTabsDynamicEffect: boolean
  topComponent: TopComponent
  traditionalTopSpacing: TraditionalTopSpacing
  content: MatrixContent
  text: string
  pet: MatrixPet
  color: string
  burningAmplitude: number
  transitionsEnabled: boolean
  tabAppearance: TabAppearance
}

export function sanitizeHomeSettings(persisted: unknown): HomeSettings {
  const saved = persisted as Partial<HomeSettings> | null
  const wideGridColumns = isGridComponentColumnCount(saved?.wideGridColumns)
    ? saved.wideGridColumns
    : DEFAULT_WIDE_GRID_COLUMNS
  const narrowGridColumns = isGridComponentColumnCount(saved?.narrowGridColumns)
    ? (Math.min(
        saved.narrowGridColumns,
        wideGridColumns
      ) as GridComponentColumnCount)
    : (Math.min(
        DEFAULT_NARROW_GRID_COLUMNS,
        wideGridColumns
      ) as GridComponentColumnCount)
  return {
    tabAppearance: sanitizeTabAppearance(saved?.tabAppearance),
    layoutMode: saved?.layoutMode === "free" ? "free" : "traditional",
    quickBar:
      saved?.quickBar === undefined
        ? defaultQuickBar()
        : sanitizeQuickBarConfig(saved.quickBar),
    wideGridColumns,
    narrowGridColumns,
    gridScale: clampGridScale(saved?.gridScale) ?? DEFAULT_GRID_SCALE,
    backgroundType: saved?.backgroundType === "image" ? "image" : "solid",
    backgroundImage:
      typeof saved?.backgroundImage === "string" ? saved.backgroundImage : null,
    backgroundPalette: isBackgroundPaletteId(saved?.backgroundPalette)
      ? saved.backgroundPalette
      : "gray",
    searchBoxStyle: saved?.searchBoxStyle === "minimal" ? "minimal" : "full",
    searchShortcuts:
      saved?.searchShortcuts === undefined
        ? defaultSearchShortcuts()
        : sanitizeSearchShortcuts(saved.searchShortcuts),
    folderStyle:
      saved?.folderStyle === "classic" || saved?.folderStyle === "none"
        ? saved.folderStyle
        : "noise",
    tabTexture:
      saved?.tabTexture === "none" || saved?.tabTexture === "particles"
        ? saved.tabTexture
        : "burning",
    tabEffectCoverage:
      typeof saved?.tabEffectCoverage === "number" &&
      Number.isFinite(saved.tabEffectCoverage)
        ? Math.round(
            Math.min(
              MAX_TAB_EFFECT_COVERAGE,
              Math.max(MIN_TAB_EFFECT_COVERAGE, saved.tabEffectCoverage)
            )
          )
        : DEFAULT_TAB_EFFECT_COVERAGE,
    newTabsDynamicEffect: saved?.newTabsDynamicEffect === true,
    burningAmplitude:
      typeof saved?.burningAmplitude === "number" &&
      Number.isFinite(saved.burningAmplitude)
        ? Math.min(2, Math.max(0, saved.burningAmplitude))
        : 1,
    transitionsEnabled: saved?.transitionsEnabled === true,
    topComponent: saved?.topComponent === "none" ? "none" : "dot-matrix",
    traditionalTopSpacing: isTraditionalTopSpacing(saved?.traditionalTopSpacing)
      ? saved.traditionalTopSpacing
      : defaultTraditionalTopSpacing,
    content:
      saved?.content === "text" ||
      saved?.content === "pet" ||
      saved?.content === "breathing"
        ? saved.content
        : "time",
    text:
      typeof saved?.text === "string"
        ? saved.text.replace(/[^\x20-\x7e]/g, "").slice(0, 80)
        : "HELLO WORLD",
    color:
      typeof saved?.color === "string" && /^#[0-9a-f]{6}$/i.test(saved.color)
        ? saved.color
        : "#3478f6",
    pet: isMatrixPet(saved?.pet) ? saved.pet : "cat",
  }
}
