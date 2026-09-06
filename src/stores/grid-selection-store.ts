import { create } from "zustand"
export const useGridSelectionStore = create<{
  active: boolean
  ids: string[]
  toggleMode: () => void
  toggle: (id: string) => void
  finish: () => void
}>()((set, get) => ({
  active: false,
  ids: [],
  toggleMode: () => {
    if (get().active) get().finish()
    else set({ active: true, ids: [] })
  },
  toggle: (id) =>
    set((state) => ({
      ids: state.ids.includes(id)
        ? state.ids.filter((value) => value !== id)
        : [...state.ids, id],
    })),
  finish: () => set({ active: false, ids: [] }),
}))
