import { create } from "zustand"
export const useGridSelectionStore = create<{
  active: boolean
  ids: string[]
  toggleMode: () => void
  setIds: (ids: string[]) => void
  toggle: (id: string) => void
  finish: () => void
}>()((set, get) => ({
  active: false,
  ids: [],
  toggleMode: () => {
    if (get().active) get().finish()
    else set({ active: true, ids: [] })
  },
  setIds: (ids) =>
    set((state) =>
      state.ids.length === ids.length &&
      state.ids.every((id, index) => id === ids[index])
        ? state
        : { ids }
    ),
  toggle: (id) =>
    set((state) => ({
      ids: state.ids.includes(id)
        ? state.ids.filter((value) => value !== id)
        : [...state.ids, id],
    })),
  finish: () => set({ active: false, ids: [] }),
}))
