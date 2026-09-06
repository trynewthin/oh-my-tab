import { create } from "zustand"

export type SettingsSection =
  "general" | "search-engines" | "home" | "personalization"

type SettingsState = {
  open: boolean
  section: SettingsSection
  openSettings: (section: SettingsSection) => void
  setOpen: (open: boolean) => void
  setSection: (section: SettingsSection) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  open: false,
  section: "search-engines",
  openSettings: (section) => set({ open: true, section }),
  setOpen: (open) => set({ open }),
  setSection: (section) => set({ section }),
}))
