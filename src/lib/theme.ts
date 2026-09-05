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
  const syncStorage = (event: StorageEvent) => {
    if (event.key === "omt.theme-mode" || event.key === null)
      void useThemeStore.persist.rehydrate()
  }
  window.addEventListener("storage", syncStorage)
  return () => {
    unsubscribe()
    media.removeEventListener("change", apply)
    window.removeEventListener("storage", syncStorage)
  }
}
