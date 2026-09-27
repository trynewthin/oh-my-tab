import { create } from "zustand"
import {
  defaultSettingsSection,
  type SettingsSection,
} from "@/lib/settings-sections"

export type SystemOverlay = "settings" | "components" | "add-tab" | "add-folder"
type OpenableOverlay = Exclude<SystemOverlay, "settings">

type SystemOverlayState = {
  active: SystemOverlay | null
  settingsSection: SettingsSection
  open: (overlay: OpenableOverlay) => void
  openSettings: (section?: SettingsSection) => void
  close: (overlay: SystemOverlay) => void
  setSettingsSection: (section: SettingsSection) => void
}

export const useSystemOverlayStore = create<SystemOverlayState>()((set) => ({
  active: null,
  settingsSection: defaultSettingsSection,
  open: (overlay) => set({ active: overlay }),
  openSettings: (section) =>
    set((state) => ({
      active: "settings",
      settingsSection: section ?? state.settingsSection,
    })),
  close: (overlay) =>
    set((state) => (state.active === overlay ? { active: null } : state)),
  setSettingsSection: (section) => set({ settingsSection: section }),
}))
