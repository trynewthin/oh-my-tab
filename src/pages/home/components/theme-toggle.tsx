import { Desktop, Moon, Sun } from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/theme-store"

const themes = {
  light: { label: "浅色", next: "深色", icon: Sun },
  dark: { label: "深色", next: "跟随系统", icon: Moon },
  system: { label: "跟随系统", next: "浅色", icon: Desktop },
}

export default function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme)
  const cycleTheme = useThemeStore((state) => state.cycleTheme)
  const current = themes[theme]
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      data-tour="theme"
      className="mr-auto"
      aria-label={`当前${current.label}，切换为${current.next}`}
      title={`当前${current.label}，点击切换为${current.next}`}
      onClick={(event) => {
        event.stopPropagation()
        cycleTheme()
      }}
    >
      <current.icon />
    </Button>
  )
}
