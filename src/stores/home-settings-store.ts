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
  emptyQuickBar,
  MAX_QUICK_CONTROLS_PER_SIDE,
  normalizeQuickSite,
  placeQuickControl,
  sanitizeQuickBarConfig,
  type QuickBarCenter,
  type QuickBarConfig,
  type QuickBarControl,
  type QuickBarSide,
} from "@/lib/quick-bar"
import type { ButtonAction } from "@/lib/grid/types"

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
  folderStyle: FolderStyle
  tabTexture: TabTexture
  topComponent: TopComponent
  content: MatrixContent
  text: string
  pet: MatrixPet
  color: string
  burningAmplitude: number
  transitionsEnabled: boolean
}
type HomeSettingsStore = HomeSettings & {
  addQuickSystemControl: (side: QuickBarSide, action: ButtonAction) => void
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
  setFolderStyle: (value: FolderStyle) => void
  setTabTexture: (value: TabTexture) => void
  setTopComponent: (value: TopComponent) => void
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
      quickBar: emptyQuickBar(),
      wideGridColumns: DEFAULT_WIDE_GRID_COLUMNS,
      narrowGridColumns: DEFAULT_NARROW_GRID_COLUMNS,
      backgroundType: "solid",
      backgroundImage: null,
      backgroundPalette: "gray",
      searchBoxStyle: "full",
      folderStyle: "noise",
      tabTexture: "burning",
      topComponent: "dot-matrix",
      content: "time",
      text: "HELLO WORLD",
      pet: "cat",
      color: "#3478f6",
      burningAmplitude: 1,
      transitionsEnabled: false,
      setBackgroundType: (backgroundType) => set({ backgroundType }),
      setLayoutMode: (layoutMode) => set({ layoutMode }),
      addQuickSystemControl: (side, action) =>
        set((state) => ({
          quickBar: {
            ...state.quickBar,
            [side]: [
              ...state.quickBar[side],
              { id: crypto.randomUUID(), kind: "system", action },
            ].slice(0, MAX_QUICK_CONTROLS_PER_SIDE),
          },
        })),
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
      setFolderStyle: (folderStyle) => set({ folderStyle }),
      setTabTexture: (tabTexture) => set({ tabTexture }),
      setBurningAmplitude: (value) => {
        if (Number.isFinite(value))
          set({ burningAmplitude: Math.min(2, Math.max(0, value)) })
      },
      setTransitionsEnabled: (transitionsEnabled) =>
        set({ transitionsEnabled }),
      setTopComponent: (topComponent) => set({ topComponent }),
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
        folderStyle,
        tabTexture,
        topComponent,
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
        folderStyle,
        tabTexture,
        topComponent,
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
          quickBar: sanitizeQuickBarConfig(saved?.quickBar),
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
