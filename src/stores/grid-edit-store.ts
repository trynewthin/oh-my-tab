import { create } from "zustand"

export const useGridEditStore = create<{
  active: boolean
  toggleMode: () => void
  finish: () => void
}>()((set, get) => ({
  active: false,
  toggleMode: () => {
    if (get().active) set({ active: false })
    else set({ active: true })
  },
  finish: () => set({ active: false }),
}))
