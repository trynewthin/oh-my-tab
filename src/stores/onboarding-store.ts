import { project } from "@/lib/data/projection"
import { create } from "zustand"

export const useOnboardingStore = create<{
  seen: boolean
  replay: boolean
  start: () => void
  finish: () => void
}>()(
  project(
    (set) => ({
      seen: false,
      replay: false,
      start: () => set({ replay: true }),
      finish: () => set({ seen: true, replay: false }),
    }),
    {
      section: "onboarding",
      partialize: ({ seen }) => ({ seen }),
    }
  )
)
