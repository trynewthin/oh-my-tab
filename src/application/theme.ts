import { useThemeStore } from "@/stores/theme-store"

export function startThemeSync() {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const apply = () => {
    const { theme } = useThemeStore.getState()
    const dark = theme === "dark" || (theme === "system" && media.matches)
    document.documentElement.classList.toggle("dark", dark)
    document.documentElement.style.colorScheme = dark ? "dark" : "light"
  }
  apply()
  const unsubscribe = useThemeStore.subscribe(apply)
  media.addEventListener("change", apply)
  return () => {
    unsubscribe()
    media.removeEventListener("change", apply)
  }
}
