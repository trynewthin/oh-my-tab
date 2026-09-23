import SettingItem from "../shared/setting-item"
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
import { Desktop, Moon, Sun } from "@phosphor-icons/react"

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

export default function AppearancePane() {
  const { t } = useTranslation()
  const theme = useThemeStore((state) => state.theme)
  const setTheme = useThemeStore((state) => state.setTheme)
  const color = useHomeSettingsStore((state) => state.color)
  const setColor = useHomeSettingsStore((state) => state.setColor)
  return (
    <>
      <SettingItem label={t("settings.appearance.accentColor")}>
        <ColorPicker
          label={t("settings.appearance.accentColor")}
          value={color}
          onChange={setColor}
          className={settingsControlClassName}
        />
      </SettingItem>
      <SettingItem
        label={t("settings.appearance.themeMode")}
        labelId="theme-mode-label"
      >
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
      </SettingItem>
      <BackgroundSettings />
    </>
  )
}
