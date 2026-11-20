import { project } from "@/lib/data/projection"
import { themeSchema, type Config } from "@/lib/data/config"
import type { SettingsAppearance, UiDepth, UiRadius } from "@/lib/ui-appearance"
import { create } from "zustand"

export type Theme = Config["theme"]["theme"]
type ThemeState = Config["theme"] & {
  setTheme: (theme: Theme) => void
  setUiRadius: (uiRadius: UiRadius) => void
  setUiBorder: (uiBorder: UiDepth) => void
  setUiShadow: (uiShadow: UiDepth) => void
  setSettingsAppearance: (patch: SettingsAppearance) => void
}

export const useThemeStore = create<ThemeState>()(
  project(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
      setUiRadius: (uiRadius) => set({ uiRadius }),
      setUiBorder: (uiBorder) => set({ uiBorder }),
      setUiShadow: (uiShadow) => set({ uiShadow }),
      setSettingsAppearance: (patch) =>
        set((state) => ({
          settingsAppearance: { ...state.settingsAppearance, ...patch },
        })),
    }),
    {
      section: "theme",
      partialize: ({
        theme,
        uiRadius,
        uiBorder,
        uiShadow,
        settingsAppearance,
      }) => ({
        theme,
        uiRadius,
        uiBorder,
        uiShadow,
        settingsAppearance,
      }),
      merge: (persisted, current) => {
        const result = themeSchema.safeParse(persisted)
        return {
          ...current,
          theme: result.data?.theme ?? "light",
          uiRadius: result.data?.uiRadius,
          uiBorder: result.data?.uiBorder,
          uiShadow: result.data?.uiShadow,
          settingsAppearance: result.data?.settingsAppearance,
        }
      },
    }
  )
)
