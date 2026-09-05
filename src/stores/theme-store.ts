import { create } from "zustand"
import { persist } from "zustand/middleware"

export type Theme = "light" | "dark" | "system"
type ThemeState = {
  theme: Theme
  cycleTheme: () => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: "light",
      cycleTheme: () =>
        set(({ theme }) => ({
          theme:
            theme === "light" ? "dark" : theme === "dark" ? "system" : "light",
        })),
    }),
    {
      name: "omt.theme-mode",
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
