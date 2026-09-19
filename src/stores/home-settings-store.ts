import { storageOptions } from "@/lib/storage"
import {
  isMatrixPet,
  type MatrixPet,
} from "@/components/dot-matrix/pet-catalog"
export type { MatrixPet } from "@/components/dot-matrix/pet-catalog"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  isBackgroundPaletteId,
  type BackgroundPaletteId,
} from "@/lib/background-palettes"

export type TopComponent = "none" | "dot-matrix"
export type MatrixContent = "time" | "text" | "pet" | "breathing"
export type EffectStyle = "none" | "burning" | "particles"
export type FolderStyle = "classic" | "noise" | "none"
export type TabTexture = EffectStyle
export type BackgroundType = "solid" | "image"
export type SearchBoxStyle = "full" | "minimal"

type HomeSettings = {
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
  setBackgroundType: (value: BackgroundType) => void
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
        return {
          ...current,
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
