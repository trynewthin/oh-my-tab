import { create } from "zustand"
import { persist } from "zustand/middleware"

export const useOnboardingStore = create<{
  seen: boolean
  replay: boolean
  start: () => void
  finish: () => void
}>()(
  persist(
    (set) => ({
      seen: false,
      replay: false,
      start: () => set({ replay: true }),
      finish: () => set({ seen: true, replay: false }),
    }),
    {
      name: "omt.onboarding",
      partialize: ({ seen }) => ({ seen }),
    }
  )
)
