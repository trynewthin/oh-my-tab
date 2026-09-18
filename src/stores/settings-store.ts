import { create } from "zustand"
import {
  defaultSettingsSection,
  type SettingsSection,
} from "@/components/settings/settings-views"

export type { SettingsSection }

type SettingsState = {
  open: boolean
  section: SettingsSection
  openSettings: (section: SettingsSection) => void
  setOpen: (open: boolean) => void
  setSection: (section: SettingsSection) => void
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  open: false,
  section: defaultSettingsSection,
  openSettings: (section) => set({ open: true, section }),
  setOpen: (open) => set({ open }),
  setSection: (section) => set({ section }),
}))
