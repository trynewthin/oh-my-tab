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
export type BackgroundType = "solid" | "image"

type HomeSettings = {
  backgroundType: BackgroundType
  backgroundImage: string | null
  backgroundPalette: BackgroundPaletteId
  folderStyle: FolderStyle
  topComponent: TopComponent
  content: MatrixContent
  text: string
  pet: MatrixPet
  color: string
  effectStyle: EffectStyle
  burningAmplitude: number
  transitionsEnabled: boolean
}
type HomeSettingsStore = HomeSettings & {
  setBackgroundType: (value: BackgroundType) => void
  setBackgroundImage: (value: string | null) => void
  setBackgroundPalette: (value: BackgroundPaletteId) => void
  setFolderStyle: (value: FolderStyle) => void
  setTopComponent: (value: TopComponent) => void
  setContent: (value: MatrixContent) => void
  setText: (value: string) => void
  setPet: (value: MatrixPet) => void
  setColor: (value: string) => void
  setEffectStyle: (value: EffectStyle) => void
  setBurningAmplitude: (value: number) => void
  setTransitionsEnabled: (value: boolean) => void
}

export const useHomeSettingsStore = create<HomeSettingsStore>()(
  persist(
    (set) => ({
      backgroundType: "solid",
      backgroundImage: null,
      backgroundPalette: "gray",
      folderStyle: "noise",
      topComponent: "dot-matrix",
      content: "time",
      text: "HELLO WORLD",
      pet: "cat",
      color: "#3478f6",
      effectStyle: "burning",
      setEffectStyle: (effectStyle) => set({ effectStyle }),
      burningAmplitude: 1,
      transitionsEnabled: false,
      setBackgroundType: (backgroundType) => set({ backgroundType }),
      setBackgroundImage: (backgroundImage) => set({ backgroundImage }),
      setBackgroundPalette: (backgroundPalette) => set({ backgroundPalette }),
      setFolderStyle: (folderStyle) => set({ folderStyle }),
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
      name: "omt.home-settings",
      partialize: ({
        backgroundType,
        backgroundImage,
        backgroundPalette,
        folderStyle,
        topComponent,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
        effectStyle,
      }) => ({
        backgroundType,
        backgroundImage,
        backgroundPalette,
        folderStyle,
        topComponent,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
        effectStyle,
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
          folderStyle:
            saved?.folderStyle === "classic" || saved?.folderStyle === "none"
              ? saved.folderStyle
              : "noise",
          effectStyle:
            saved?.effectStyle === "none" || saved?.effectStyle === "particles"
              ? saved.effectStyle
              : "burning",
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
