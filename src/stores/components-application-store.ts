import { create } from "zustand"

type ComponentsApplicationState = {
  open: boolean
  setOpen: (open: boolean) => void
}

export const useComponentsApplicationStore =
  create<ComponentsApplicationState>()((set) => ({
    open: false,
    setOpen: (open) => set({ open }),
  }))
