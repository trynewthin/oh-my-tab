import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useTranslation } from "react-i18next"
import { GridFour, SquaresFour } from "@phosphor-icons/react"

const layoutOptions = [
  {
    value: "traditional",
    labelKey: "settings.home.layoutTraditional",
    icon: SquaresFour,
  },
  {
    value: "free",
    labelKey: "settings.home.layoutFree",
    icon: GridFour,
  },
] as const

export default function LayoutPane() {
  const { t } = useTranslation()
  const layoutMode = useHomeSettingsStore((state) => state.layoutMode)
  const setLayoutMode = useHomeSettingsStore((state) => state.setLayoutMode)

  return (
    <SettingItem
      label={t("settings.home.layoutMode")}
      labelId="home-layout-label"
    >
      <ToggleGroup
        aria-labelledby="home-layout-label"
        className={settingsControlSurface}
        value={[layoutMode]}
        onValueChange={(values) => {
          const value = values[0]
          if (value === "traditional" || value === "free") setLayoutMode(value)
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
    </SettingItem>
  )
}
