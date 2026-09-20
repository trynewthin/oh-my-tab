import {
  settingsControlClassName,
  settingsControlSurface,
} from "../shared/control-styles"
import ColorPicker from "@/components/ui/color-picker"
import BackgroundSettings from "./background-settings"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useTranslation } from "react-i18next"
import {
  Desktop,
  GridFour,
  Moon,
  SquaresFour,
  Sun,
} from "@phosphor-icons/react"

const themeOptions = [
  { value: "light", labelKey: "settings.appearance.themeLight", icon: Sun },
  { value: "dark", labelKey: "settings.appearance.themeDark", icon: Moon },
  {
    value: "system",
    labelKey: "settings.appearance.themeSystem",
    ariaKey: "settings.appearance.themeSystemAria",
    icon: Desktop,
  },
] as const

const layoutOptions = [
  {
    value: "traditional",
    labelKey: "settings.appearance.layoutTraditional",
    icon: SquaresFour,
  },
  {
    value: "free",
    labelKey: "settings.appearance.layoutFree",
    icon: GridFour,
  },
] as const

export default function AppearancePane() {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const color = useHomeSettingsStore((state) => state.color)
  const setColor = useHomeSettingsStore((state) => state.setColor)
  const layoutMode = useHomeSettingsStore((state) => state.layoutMode)
  const setLayoutMode = useHomeSettingsStore((state) => state.setLayoutMode)
  return (
    <>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span id="home-layout-label" className="text-sm">
          {t("settings.appearance.layoutMode")}
        </span>
        <ToggleGroup
          aria-labelledby="home-layout-label"
          className={settingsControlSurface}
          value={[layoutMode]}
          onValueChange={(values) => {
            const value = values[0]
            if (value === "traditional" || value === "free")
              setLayoutMode(value)
          }}
        >
          {layoutOptions.map((option) => (
            <ToggleGroupItem
              key={option.value}
              value={option.value}
              aria-label={t(option.labelKey)}
              title={t(option.labelKey)}
            >
              <option.icon weight="bold" />
              <span>{t(option.labelKey)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">{t("settings.appearance.accentColor")}</span>
        <ColorPicker
          label={t("settings.appearance.accentColor")}
          value={color}
          onChange={setColor}
          className={settingsControlClassName}
        />
      </div>
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span id="theme-mode-label" className="text-sm">
          {t("settings.appearance.themeMode")}
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
                "ariaKey" in option ? t(option.ariaKey) : t(option.labelKey)
              }
              title={
                "ariaKey" in option ? t(option.ariaKey) : t(option.labelKey)
              }
            >
              <option.icon weight="bold" />
              <span>{t(option.labelKey)}</span>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <BackgroundSettings />
    </>
  )
}
