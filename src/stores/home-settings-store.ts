import { storageOptions } from "@/lib/storage"
import { isMatrixPet, type MatrixPet } from "@/lib/matrix-pets"
export type { MatrixPet } from "@/lib/matrix-pets"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  isBackgroundPaletteId,
  type BackgroundPaletteId,
} from "@/lib/background-palettes"
import {
  DEFAULT_NARROW_GRID_COLUMNS,
  DEFAULT_WIDE_GRID_COLUMNS,
  isGridComponentColumnCount,
  type GridComponentColumnCount,
} from "@/lib/grid/grid-layout"
import {
  defaultQuickBar,
  MAX_QUICK_CONTROLS_PER_SIDE,
  normalizeQuickSite,
  placeQuickControl,
  sanitizeQuickBarConfig,
  type QuickBarCenter,
  type QuickBarConfig,
  type QuickBarControl,
  type QuickBarSide,
} from "@/lib/quick-bar"
import {
  isSystemActionOnSurface,
  type SystemActionId,
} from "@/lib/system-actions"
import {
  defaultTraditionalTopSpacing,
  isTraditionalTopSpacing,
  type TraditionalTopSpacing,
} from "@/lib/home-top-spacing"
import {
  appendSearchShortcut,
  defaultSearchShortcuts,
  moveSearchShortcut,
  removeSearchShortcut,
  sanitizeSearchShortcuts,
  setSearchShortcutBoundary,
  type SearchShortcutConfig,
} from "@/lib/search-shortcuts"

export type TopComponent = "none" | "dot-matrix"
export type MatrixContent = "time" | "text" | "pet" | "breathing"
export type EffectStyle = "none" | "burning" | "particles"
export type FolderStyle = "classic" | "noise" | "none"
export type TabTexture = EffectStyle
export type BackgroundType = "solid" | "image"
export type SearchBoxStyle = "full" | "minimal"
export type HomeLayoutMode = "traditional" | "free"

type HomeSettings = {
  layoutMode: HomeLayoutMode
  quickBar: QuickBarConfig
  wideGridColumns: GridComponentColumnCount
  narrowGridColumns: GridComponentColumnCount
  backgroundType: BackgroundType
  backgroundImage: string | null
  backgroundPalette: BackgroundPaletteId
  searchBoxStyle: SearchBoxStyle
  searchShortcuts: SearchShortcutConfig
  folderStyle: FolderStyle
  tabTexture: TabTexture
  newTabsDynamicEffect: boolean
  topComponent: TopComponent
  traditionalTopSpacing: TraditionalTopSpacing
  content: MatrixContent
  text: string
  pet: MatrixPet
  color: string
  burningAmplitude: number
  transitionsEnabled: boolean
}
type HomeSettingsStore = HomeSettings & {
  addQuickSystemControl: (side: QuickBarSide, action: SystemActionId) => void
  addQuickSiteControl: (
    side: QuickBarSide,
    name: string,
    url: string
  ) => boolean
  updateQuickSiteControl: (id: string, name: string, url: string) => boolean
  removeQuickControl: (id: string) => void
  placeQuickControl: (id: string, side: QuickBarSide, index: number) => void
  setQuickBarCenter: (center: QuickBarCenter) => void
  setBackgroundType: (value: BackgroundType) => void
  setLayoutMode: (value: HomeLayoutMode) => void
  setWideGridColumns: (value: GridComponentColumnCount) => void
  setNarrowGridColumns: (value: GridComponentColumnCount) => void
  setBackgroundImage: (value: string | null) => void
  setBackgroundPalette: (value: BackgroundPaletteId) => void
  setSearchBoxStyle: (value: SearchBoxStyle) => void
  addSearchShortcut: (action: SystemActionId) => void
  removeSearchShortcut: (id: string) => void
  moveSearchShortcut: (id: string, index: number) => void
  setSearchShortcutBoundary: (index: number) => void
  setFolderStyle: (value: FolderStyle) => void
  setTabTexture: (value: TabTexture) => void
  setNewTabsDynamicEffect: (value: boolean) => void
  setTopComponent: (value: TopComponent) => void
  setTraditionalTopSpacing: (value: TraditionalTopSpacing) => void
  setContent: (value: MatrixContent) => void
  setText: (value: string) => void
  setPet: (value: MatrixPet) => void
  setColor: (value: string) => void
  setBurningAmplitude: (value: number) => void
  setTransitionsEnabled: (value: boolean) => void
}

export const useHomeSettingsStore = create<HomeSettingsStore>()(
  persist(
    (set) => ({
      layoutMode: "traditional",
      quickBar: defaultQuickBar(),
      wideGridColumns: DEFAULT_WIDE_GRID_COLUMNS,
      narrowGridColumns: DEFAULT_NARROW_GRID_COLUMNS,
      backgroundType: "solid",
      backgroundImage: null,
      backgroundPalette: "gray",
      searchBoxStyle: "full",
      searchShortcuts: defaultSearchShortcuts(),
      folderStyle: "noise",
      tabTexture: "burning",
      newTabsDynamicEffect: false,
      topComponent: "dot-matrix",
      traditionalTopSpacing: defaultTraditionalTopSpacing,
      content: "time",
      text: "HELLO WORLD",
      pet: "cat",
      color: "#3478f6",
      burningAmplitude: 1,
      transitionsEnabled: false,
      setBackgroundType: (backgroundType) => set({ backgroundType }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      addQuickSystemControl: (side, action) => {
        if (!isSystemActionOnSurface(action, "quick-bar")) return
        set((state) => ({
          quickBar: {
            ...state.quickBar,
            [side]: [
              ...state.quickBar[side],
              { id: crypto.randomUUID(), kind: "system", action },
            ].slice(0, MAX_QUICK_CONTROLS_PER_SIDE),
          },
        }))
      },
      addQuickSiteControl: (side, name, url) => {
        const site = normalizeQuickSite(name, url)
        if (!site) return false
        set((state) => ({
          quickBar: {
            ...state.quickBar,
            [side]: [
              ...state.quickBar[side],
              { id: crypto.randomUUID(), kind: "site", ...site },
            ].slice(0, MAX_QUICK_CONTROLS_PER_SIDE) as QuickBarControl[],
          },
        }))
        return true
      },
      updateQuickSiteControl: (id, name, url) => {
        const site = normalizeQuickSite(name, url)
        if (!site) return false
        set((state) => ({
          quickBar: {
            left: state.quickBar.left.map((control) =>
              control.id === id && control.kind === "site"
                ? { ...control, ...site }
                : control
            ),
            center: state.quickBar.center,
            right: state.quickBar.right.map((control) =>
              control.id === id && control.kind === "site"
                ? { ...control, ...site }
                : control
            ),
          },
        }))
        return true
      },
      removeQuickControl: (id) =>
        set((state) => ({
          quickBar: {
            ...state.quickBar,
            left: state.quickBar.left.filter((control) => control.id !== id),
            right: state.quickBar.right.filter((control) => control.id !== id),
          },
        })),
      placeQuickControl: (id, side, index) =>
        set((state) => ({
          quickBar: placeQuickControl(state.quickBar, id, side, index),
        })),
      setQuickBarCenter: (center) =>
        set((state) => ({
          quickBar: { ...state.quickBar, center },
        })),
      setWideGridColumns: (wideGridColumns) =>
        set((state) => ({
          wideGridColumns,
          narrowGridColumns: Math.min(
            state.narrowGridColumns,
            wideGridColumns
          ) as GridComponentColumnCount,
        })),
      setNarrowGridColumns: (narrowGridColumns) =>
        set((state) => ({
          narrowGridColumns: Math.min(
            narrowGridColumns,
            state.wideGridColumns
          ) as GridComponentColumnCount,
        })),
      setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
      setBackgroundPalette: (backgroundPalette) => set({ backgroundPalette }),
      setSearchBoxStyle: (searchBoxStyle) => set({ searchBoxStyle }),
      addSearchShortcut: (action) =>
        set((state) => {
          const next = appendSearchShortcut(state.searchShortcuts, {
            id: crypto.randomUUID(),
            action,
          })
          return next === state.searchShortcuts
            ? state
            : { searchShortcuts: next }
        }),
      removeSearchShortcut: (id) =>
        set((state) => {
          const next = removeSearchShortcut(state.searchShortcuts, id)
          return next === state.searchShortcuts
            ? state
            : { searchShortcuts: next }
        }),
      moveSearchShortcut: (id, index) =>
        set((state) => {
          const next = moveSearchShortcut(state.searchShortcuts, id, index)
          return next === state.searchShortcuts
            ? state
            : { searchShortcuts: next }
        }),
      setSearchShortcutBoundary: (index) =>
        set((state) => {
          const next = setSearchShortcutBoundary(state.searchShortcuts, index)
          return next === state.searchShortcuts
            ? state
            : { searchShortcuts: next }
        }),
      setFolderStyle: (folderStyle) => set({ folderStyle }),
      setTabTexture: (tabTexture) => set({ tabTexture }),
      setNewTabsDynamicEffect: (newTabsDynamicEffect) =>
        set({ newTabsDynamicEffect }),
      setBurningAmplitude: (value) => {
        if (Number.isFinite(value))
          set({ burningAmplitude: Math.min(2, Math.max(0, value)) })
      },
      setTransitionsEnabled: (transitionsEnabled) =>
        set({ transitionsEnabled }),
      setTopComponent: (topComponent) => set({ topComponent }),
      setTraditionalTopSpacing: (traditionalTopSpacing) =>
        set({ traditionalTopSpacing }),
      setContent: (content) => set({ content }),
      setText: (text) =>
        set({ text: text.replace(/[^\x20-\x7e]/g, "").slice(0, 80) }),
      setPet: (pet) => set({ pet }),
      setColor: (color) => {
        if (/^#[0-9a-f]{6}$/i.test(color)) set({ color })
      },
    }),
    {
      ...storageOptions(),
      name: "omt.home-settings",
      partialize: ({
        layoutMode,
        quickBar,
        wideGridColumns,
        narrowGridColumns,
        backgroundType,
        backgroundImage,
        backgroundPalette,
        searchBoxStyle,
        searchShortcuts,
        folderStyle,
        tabTexture,
        newTabsDynamicEffect,
        topComponent,
        traditionalTopSpacing,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
      }) => ({
        layoutMode,
        quickBar,
        wideGridColumns,
        narrowGridColumns,
        backgroundType,
        backgroundImage,
        backgroundPalette,
        searchBoxStyle,
        searchShortcuts,
        folderStyle,
        tabTexture,
        newTabsDynamicEffect,
        topComponent,
        traditionalTopSpacing,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<HomeSettings> | null
        const wideGridColumns = isGridComponentColumnCount(
          saved?.wideGridColumns
        )
          ? saved.wideGridColumns
          : DEFAULT_WIDE_GRID_COLUMNS
        const narrowGridColumns = isGridComponentColumnCount(
          saved?.narrowGridColumns
        )
          ? (Math.min(
              saved.narrowGridColumns,
              wideGridColumns
            ) as GridComponentColumnCount)
          : (Math.min(
              DEFAULT_NARROW_GRID_COLUMNS,
              wideGridColumns
            ) as GridComponentColumnCount)
        return {
          ...current,
          layoutMode: saved?.layoutMode === "free" ? "free" : "traditional",
          quickBar:
            saved?.quickBar === undefined
              ? defaultQuickBar()
              : sanitizeQuickBarConfig(saved.quickBar),
          wideGridColumns,
          narrowGridColumns,
          backgroundType: saved?.backgroundType === "image" ? "image" : "solid",
          backgroundImage:
            typeof saved?.backgroundImage === "string"
              ? saved.backgroundImage
              : null,
          backgroundPalette: isBackgroundPaletteId(saved?.backgroundPalette)
            ? saved.backgroundPalette
            : "gray",
          searchBoxStyle:
            saved?.searchBoxStyle === "minimal" ? "minimal" : "full",
          searchShortcuts:
            saved?.searchShortcuts === undefined
              ? defaultSearchShortcuts()
              : sanitizeSearchShortcuts(saved.searchShortcuts),
          folderStyle:
            saved?.folderStyle === "classic" || saved?.folderStyle === "none"
              ? saved.folderStyle
              : "noise",
          // Legacy `effectStyle` (the old global material) seeds tabTexture
          // for users upgrading from before the two were merged.
          tabTexture: (() => {
            const legacy =
              saved?.tabTexture ??
              (saved as { effectStyle?: string } | null)?.effectStyle
            return legacy === "none" || legacy === "particles"
              ? legacy
              : "burning"
          })(),
          newTabsDynamicEffect: saved?.newTabsDynamicEffect === true,
          burningAmplitude:
            typeof saved?.burningAmplitude === "number" &&
            Number.isFinite(saved.burningAmplitude)
              ? Math.min(2, Math.max(0, saved.burningAmplitude))
              : 1,
          transitionsEnabled:
            (saved?.transitionsEnabled ??
              (saved as { burningEntrance?: boolean } | null)
                ?.burningEntrance) === true,
          topComponent: saved?.topComponent === "none" ? "none" : "dot-matrix",
          traditionalTopSpacing: isTraditionalTopSpacing(
            saved?.traditionalTopSpacing
          )
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
              : current.text,
          color:
            typeof saved?.color === "string" &&
            /^#[0-9a-f]{6}$/i.test(saved.color)
              ? saved.color
              : current.color,
          pet: isMatrixPet(saved?.pet) ? saved.pet : "cat",
        }
      },
    }
  )
)
