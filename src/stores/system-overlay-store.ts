import { create } from "zustand"
import { isAppWindow, type AppWindowId } from "@/lib/apps/ids"
import {
  defaultSettingsSection,
  type SettingsSection,
} from "@/lib/settings-sections"

export type SystemOverlay = AppWindowId | "add-tab" | "add-folder"
type OpenableOverlay = Exclude<SystemOverlay, "settings">

type SystemOverlayState = {
  active: SystemOverlay | null
  closingApp: AppWindowId | null
  settingsSection: SettingsSection
  open: (overlay: OpenableOverlay) => void
  openSettings: (section?: SettingsSection) => void
  close: (overlay: SystemOverlay) => void
  finishClosingApp: (id: AppWindowId) => void
  setSettingsSection: (section: SettingsSection) => void
}

export const useSystemOverlayStore = create<SystemOverlayState>()((set) => ({
  active: null,
  closingApp: null,
  settingsSection: defaultSettingsSection,
  open: (overlay) => set({ active: overlay, closingApp: null }),
  openSettings: (section) =>
    set((state) => ({
      active: "settings",
      closingApp: null,
      settingsSection: section ?? state.settingsSection,
    })),
  close: (overlay) =>
    set((state) =>
      state.active === overlay
        ? { active: null, closingApp: isAppWindow(overlay) ? overlay : null }
        : state
    ),
  finishClosingApp: (id) =>
    set((state) => (state.closingApp === id ? { closingApp: null } : state)),
  setSettingsSection: (section) => set({ settingsSection: section }),
}))
