import { project } from "@/lib/data/projection"
import { create } from "zustand"

export type Theme = "light" | "dark" | "system"
type ThemeState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

export const useThemeStore = create<ThemeState>()(
  project(
    (set) => ({
      theme: "light",
      setTheme: (theme) => set({ theme }),
    }),
    {
      section: "theme",
      partialize: ({ theme }) => ({ theme }),
      merge: (persisted, current) => {
        const theme = (persisted as { theme?: unknown } | null)?.theme
        return {
          ...current,
          theme: theme === "dark" || theme === "system" ? theme : "light",
        }
      },
    }
  )
)
