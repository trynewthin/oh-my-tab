import { useThemeStore } from "@/stores/theme-store"
import { defaultUiAppearance } from "@/lib/ui-appearance"

export function startThemeSync() {
  const media = window.matchMedia("(prefers-color-scheme: dark)")
  const root = document.documentElement
  const apply = () => {
    const { theme, uiRadius, uiBorder, uiShadow } = useThemeStore.getState()
    const dark = theme === "dark" || (theme === "system" && media.matches)
    root.classList.toggle("dark", dark)
    root.style.colorScheme = dark ? "dark" : "light"
    root.dataset.uiRadius = uiRadius ?? defaultUiAppearance
    root.dataset.uiBorder = uiBorder ?? defaultUiAppearance
    root.dataset.uiShadow = uiShadow ?? defaultUiAppearance
  }
  apply()
  const unsubscribe = useThemeStore.subscribe(apply)
  media.addEventListener("change", apply)
  return () => {
    unsubscribe()
    media.removeEventListener("change", apply)
  }
}
