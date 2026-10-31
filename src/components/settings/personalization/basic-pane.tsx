import SettingItem from "../shared/setting-item"
import {
  settingsControlClassName,
  settingsControlSurface,
} from "../shared/control-styles"
import ColorPicker from "@/components/ui/color-picker"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DEFAULT_TAB_APPEARANCE } from "@/lib/tab-appearance"
import BackgroundSettings from "./background-settings"
import SettingRange from "../shared/setting-range"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { runSystemAction } from "@/application/system-actions"
import { useTranslation } from "react-i18next"
import {
  ArrowCounterClockwise,
  Desktop,
  Moon,
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

export default function BasicPane() {
  const { t } = useTranslation()
  const [resetRadiusOpen, setResetRadiusOpen] = useState(false)
  const theme = useThemeStore((state) => state.theme)
  const color = useHomeSettingsStore((state) => state.color)
  const setColor = useHomeSettingsStore((state) => state.setColor)
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  const setComponentRadius = useHomeSettingsStore(
    (state) => state.setComponentRadius
  )
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
              runSystemAction({ id: "set-theme", theme: value })
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
      <SettingItem label={t("settings.basic.radius")} htmlFor="basic-radius">
        <div className="flex min-w-0 items-center gap-2">
          <SettingRange
            id="basic-radius"
            label={t("settings.basic.radius")}
            value={radius}
            min={0}
            max={48}
            showValue={false}
            accentColor={color}
            onChange={setComponentRadius}
          />
          <Popover open={resetRadiusOpen} onOpenChange={setResetRadiusOpen}>
            <PopoverTrigger
              render={
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={settingsControlClassName}
                />
              }
              aria-label={t("settings.basic.resetRadius")}
              title={t("settings.basic.resetRadius")}
            >
              <ArrowCounterClockwise />
            </PopoverTrigger>
            <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
              <PopoverTitle>
                {t("settings.tabs.appearance.resetActionTitle", {
                  action: t("settings.basic.resetRadius"),
                })}
              </PopoverTitle>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResetRadiusOpen(false)}
                >
                  {t("settings.common.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setComponentRadius(DEFAULT_TAB_APPEARANCE.radius)
                    setResetRadiusOpen(false)
                  }}
                >
                  {t("settings.tabs.appearance.resetConfirm")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </SettingItem>
      <BackgroundSettings />
    </>
  )
}
