import { create } from "zustand"

type AppearanceState = {
  backgroundColor: string
  setBackgroundColor: (color: string) => void
}

export const useAppearanceStore = create<AppearanceState>()((set) => ({
  backgroundColor: "#ffffff",
  setBackgroundColor: (backgroundColor) => set({ backgroundColor }),
}))
