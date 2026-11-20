import { ArrowCounterClockwise, Palette } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover"
import { DEFAULT_TAB_APPEARANCE } from "@/lib/tab-appearance"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { settingsControlClassName } from "../shared/control-styles"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import SettingSection from "../shared/setting-section"
import BackgroundSettings from "./background-settings"

export default function HomeAppearanceSettings() {
  const { t } = useTranslation()
  const [resetRadiusOpen, setResetRadiusOpen] = useState(false)
  const color = useHomeSettingsStore((state) => state.color)
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  const setComponentRadius = useHomeSettingsStore(
    (state) => state.setComponentRadius
  )
  const radiusLabel = t("settings.home.componentRadius")
  const resetRadiusLabel = t("settings.home.resetComponentRadius")

  return (
    <SettingSection title={t("settings.home.appearance")} icon={<Palette />}>
      <SettingItem label={radiusLabel} htmlFor="home-component-radius">
        <div className="flex min-w-0 items-center gap-2">
          <SettingRange
            id="home-component-radius"
            label={radiusLabel}
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
              aria-label={resetRadiusLabel}
              title={resetRadiusLabel}
            >
              <ArrowCounterClockwise />
            </PopoverTrigger>
            <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
              <PopoverTitle>
                {t("settings.tabs.appearance.resetActionTitle", {
                  action: resetRadiusLabel,
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
    </SettingSection>
  )
}
