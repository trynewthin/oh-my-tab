import {
  isMatrixPet,
  type MatrixPet,
} from "@/components/dot-matrix/pet-catalog"
export type { MatrixPet } from "@/components/dot-matrix/pet-catalog"
import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TopComponent = "none" | "dot-matrix"
export type MatrixContent = "time" | "text" | "pet" | "breathing"

type HomeSettings = {
  topComponent: TopComponent
  content: MatrixContent
  text: string
  pet: MatrixPet
  color: string
  effectStyle: "burning" | "particles"
  burningAmplitude: number
  transitionsEnabled: boolean
}
type HomeSettingsStore = HomeSettings & {
  setTopComponent: (value: TopComponent) => void
  setContent: (value: MatrixContent) => void
  setText: (value: string) => void
  setPet: (value: MatrixPet) => void
  setColor: (value: string) => void
  setEffectStyle: (value: "burning" | "particles") => void
  setBurningAmplitude: (value: number) => void
  setTransitionsEnabled: (value: boolean) => void
}

export const useHomeSettingsStore = create<HomeSettingsStore>()(
  persist(
    (set) => ({
      topComponent: "dot-matrix",
      content: "time",
      text: "HELLO WORLD",
      pet: "cat",
      color: "#3478f6",
      effectStyle: "burning",
      setEffectStyle: (effectStyle) => set({ effectStyle }),
      burningAmplitude: 1,
      transitionsEnabled: false,
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
        topComponent,
        content,
        text,
        pet,
        color,
        burningAmplitude,
        transitionsEnabled,
        effectStyle,
      }) => ({
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
          effectStyle:
            saved?.effectStyle === "particles" ? "particles" : "burning",
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
