import { create } from "zustand"
import { persist } from "zustand/middleware"

export type TopComponent = "none" | "dot-matrix"
export type MatrixContent = "time" | "text" | "pet" | "breathing"
export type MatrixPet = "cat" | "dog"

type HomeSettings = {
  topComponent: TopComponent
  content: MatrixContent
  text: string
  pet: MatrixPet
  color: string
}
type HomeSettingsStore = HomeSettings & {
  setTopComponent: (value: TopComponent) => void
  setContent: (value: MatrixContent) => void
  setText: (value: string) => void
  setPet: (value: MatrixPet) => void
  setColor: (value: string) => void
}

export const useHomeSettingsStore = create<HomeSettingsStore>()(
  persist(
    (set) => ({
      topComponent: "dot-matrix",
      content: "time",
      text: "HELLO WORLD",
      pet: "cat",
      color: "#3478f6",
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
      partialize: ({ topComponent, content, text, pet, color }) => ({
        topComponent,
        content,
        text,
        pet,
        color,
      }),
      merge: (persisted, current) => {
        const saved = persisted as Partial<HomeSettings> | null
        return {
          ...current,
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
          pet: saved?.pet === "dog" ? "dog" : "cat",
        }
      },
    }
  )
)
