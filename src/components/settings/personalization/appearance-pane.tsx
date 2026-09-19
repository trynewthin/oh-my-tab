import {
  settingsControlClassName,
  settingsControlSurface,
} from "../shared/control-styles"
import ColorPicker from "@/components/ui/color-picker"
import BackgroundSettings from "./background-settings"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { Desktop, Moon, Sun } from "@phosphor-icons/react"

const themeOptions = [
  { value: "light", label: "浅色", icon: Sun },
  { value: "dark", label: "深色", icon: Moon },
  { value: "system", label: "系统", ariaLabel: "跟随系统", icon: Desktop },
] as const

export default function AppearancePane() {
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const color = useHomeSettingsStore((state) => state.color)
  const setColor = useHomeSettingsStore((state) => state.setColor)
  return (
    <>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">主题色</span>
        <ColorPicker
          label="主题色"
          value={color}
          onChange={setColor}
          className={settingsControlClassName}
        />
      </div>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span id="theme-mode-label" className="text-sm">
          深浅色模式
        </span>
        <ToggleGroup
          aria-labelledby="theme-mode-label"
          className={settingsControlSurface}
          value={[theme]}
          onValueChange={(values) => {
            const value = values[0]
            if (value === "light" || value === "dark" || value === "system")
              setTheme(value)
          }}
        >
          {themeOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={
                "ariaLabel" in option ? option.ariaLabel : option.label
              }
              title={"ariaLabel" in option ? option.ariaLabel : option.label}
            >
              <option.icon weight="bold" />
              <span>{option.label}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <BackgroundSettings />
    </>
  )
}
