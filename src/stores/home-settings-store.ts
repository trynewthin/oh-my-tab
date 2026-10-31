import { storageOptions } from "@/lib/storage"
import { type MatrixPet } from "@/lib/matrix-pets"
export type { MatrixPet } from "@/lib/matrix-pets"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type BackgroundPaletteId } from "@/lib/background-palettes"
import {
  clampGridScale,
  type GridComponentColumnCount,
} from "@/lib/grid/grid-layout"
import {
  MAX_QUICK_CONTROLS_PER_SIDE,
  normalizeQuickSite,
  placeQuickControl,
  type QuickBarCenter,
  type QuickBarControl,
  type QuickBarSide,
} from "@/lib/quick-bar"
import {
  isSystemActionOnSurface,
  type SystemActionId,
} from "@/lib/system-actions"
import { type TraditionalTopSpacing } from "@/lib/home-top-spacing"
import {
  appendSearchShortcut,
  moveSearchShortcut,
  removeSearchShortcut,
  setSearchShortcutBoundary,
} from "@/lib/search-shortcuts"
import {
  sanitizeTabAppearance,
  sanitizeSquareTabAppearance,
  type TabAppearance,
} from "@/lib/tab-appearance"

export type { TabAppearance } from "@/lib/tab-appearance"

export type {
  TopComponent,
  MatrixContent,
  EffectStyle,
  FolderStyle,
  TabTexture,
  BackgroundType,
  SearchBoxStyle,
  HomeLayoutMode,
} from "@/lib/home-settings"
export {
  MIN_TAB_EFFECT_COVERAGE,
  MAX_TAB_EFFECT_COVERAGE,
  DEFAULT_TAB_EFFECT_COVERAGE,
} from "@/lib/home-settings"
import {
  DEFAULT_FOLDER_BORDER,
  sanitizeFolderBorder,
  type FolderBorder,
} from "@/lib/folder-border"
import {
  sanitizeHomeSettings,
  type HomeSettings,
  type TopComponent,
  type MatrixContent,
  type FolderStyle,
  type TabTexture,
  type BackgroundType,
  type SearchBoxStyle,
  type HomeLayoutMode,
  MIN_TAB_EFFECT_COVERAGE,
  MAX_TAB_EFFECT_COVERAGE,
} from "@/lib/home-settings"
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
  setGridScale: (value: number) => void
  setBackgroundImage: (value: string | null) => void
  setBackgroundPalette: (value: BackgroundPaletteId) => void
  setSearchBoxStyle: (value: SearchBoxStyle) => void
  addSearchShortcut: (action: SystemActionId) => void
  removeSearchShortcut: (id: string) => void
  moveSearchShortcut: (id: string, index: number) => void
  setSearchShortcutBoundary: (index: number) => void
  setFolderStyle: (value: FolderStyle) => void
  setComponentRadius: (value: number) => void
  setFolderRadius: (value: number) => void
  setFolderBorder: (patch: Partial<FolderBorder>) => void
  resetFolderStyle: () => void
  setTabTexture: (value: TabTexture) => void
  setTabEffectCoverage: (value: number) => void
  setNewTabsDynamicEffect: (value: boolean) => void
  setTopComponent: (value: TopComponent) => void
  setTraditionalTopSpacing: (value: TraditionalTopSpacing) => void
  setContent: (value: MatrixContent) => void
  setText: (value: string) => void
  setPet: (value: MatrixPet) => void
  setColor: (value: string) => void
  setBurningAmplitude: (value: number) => void
  setTransitionsEnabled: (value: boolean) => void
  setTabAppearance: (patch: Partial<TabAppearance>) => void
  setSquareTabAppearance: (patch: Partial<TabAppearance>) => void
  setSquareTabTexture: (value: TabTexture) => void
  setSquareTabEffectCoverage: (value: number) => void
}

export const useHomeSettingsStore = create<HomeSettingsStore>()(
  persist(
    (set, get) => ({
      ...sanitizeHomeSettings(null),
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
      setGridScale: (value) => {
        const gridScale = clampGridScale(value)
        if (gridScale !== null) set({ gridScale })
      },
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
      setComponentRadius: (value) => {
        if (Number.isFinite(value)) get().setTabAppearance({ radius: value })
      },
      setFolderRadius: (value) => get().setComponentRadius(value),
      setFolderBorder: (patch) =>
        set((state) => ({
          folderBorder: sanitizeFolderBorder({
            ...state.folderBorder,
            ...patch,
          }),
        })),
      resetFolderStyle: () =>
        set({
          folderStyle: "noise",
          folderBorder: DEFAULT_FOLDER_BORDER,
        }),
      setTabTexture: (tabTexture) => set({ tabTexture }),
      setTabEffectCoverage: (value) => {
        if (Number.isFinite(value))
          set({
            tabEffectCoverage: Math.round(
              Math.min(
                MAX_TAB_EFFECT_COVERAGE,
                Math.max(MIN_TAB_EFFECT_COVERAGE, value)
              )
            ),
          })
      },
      setNewTabsDynamicEffect: (newTabsDynamicEffect) =>
        set({ newTabsDynamicEffect }),
      setBurningAmplitude: (value) => {
        if (Number.isFinite(value))
          set({ burningAmplitude: Math.min(2, Math.max(0, value)) })
      },
      setTransitionsEnabled: (transitionsEnabled) =>
        set({ transitionsEnabled }),
      setTabAppearance: (patch) =>
        set((state) => {
          const tabAppearance = sanitizeTabAppearance({
            ...state.tabAppearance,
            ...patch,
          })
          return {
            tabAppearance,
            folderRadius: tabAppearance.radius,
            ...(state.squareTabAppearance.radius !== tabAppearance.radius
              ? {
                  squareTabAppearance: {
                    ...state.squareTabAppearance,
                    radius: tabAppearance.radius,
                  },
                }
              : {}),
          }
        }),
      setSquareTabAppearance: (patch) =>
        set((state) => ({
          squareTabAppearance: sanitizeSquareTabAppearance({
            ...state.squareTabAppearance,
            ...patch,
            radius: state.tabAppearance.radius,
          }),
        })),
      setSquareTabTexture: (squareTabTexture) => set({ squareTabTexture }),
      setSquareTabEffectCoverage: (value) => {
        if (Number.isFinite(value))
          set({
            squareTabEffectCoverage: Math.round(
              Math.min(
                MAX_TAB_EFFECT_COVERAGE,
                Math.max(MIN_TAB_EFFECT_COVERAGE, value)
              )
            ),
          })
      },
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
        gridScale,
        backgroundType,
        backgroundImage,
        backgroundPalette,
        searchBoxStyle,
        searchShortcuts,
        folderStyle,
        folderRadius,
        folderBorder,
        tabTexture,
        tabEffectCoverage,
        newTabsDynamicEffect,
        topComponent,
        traditionalTopSpacing,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
        tabAppearance,
        squareTabAppearance,
        squareTabTexture,
        squareTabEffectCoverage,
      }) => ({
        layoutMode,
        quickBar,
        wideGridColumns,
        narrowGridColumns,
        gridScale,
        backgroundType,
        backgroundImage,
        backgroundPalette,
        searchBoxStyle,
        searchShortcuts,
        folderStyle,
        folderRadius,
        folderBorder,
        tabTexture,
        tabEffectCoverage,
        newTabsDynamicEffect,
        topComponent,
        traditionalTopSpacing,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
        tabAppearance,
        squareTabAppearance,
        squareTabTexture,
        squareTabEffectCoverage,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...sanitizeHomeSettings(persisted),
      }),
    }
  )
)
