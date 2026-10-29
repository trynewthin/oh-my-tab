import { useTranslation } from "react-i18next"
import {
  useHomeSettingsStore,
  MIN_TAB_EFFECT_COVERAGE,
  MAX_TAB_EFFECT_COVERAGE,
} from "@/stores/home-settings-store"
import type { TabTexture } from "@/lib/home-settings"
import TabPlaybackSetting from "./tab-playback-setting"
import EffectStylePicker from "./effect-style-picker"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"

export default function TabBackgroundControls({
  texture,
  coverage,
  onTextureChange,
  onCoverageChange,
}: {
  texture: TabTexture
  coverage: number
  onTextureChange: (value: TabTexture) => void
  onCoverageChange: (value: number) => void
}) {
  const { t } = useTranslation()
  const color = useHomeSettingsStore((state) => state.color)
  return (
    <>
      <TabPlaybackSetting />
      <SettingItem label={t("settings.tabs.texture")}>
        <EffectStylePicker
          value={texture}
          color={color}
          onChange={onTextureChange}
          labelKey="settings.tabs.texture"
        />
      </SettingItem>
      {texture !== "none" && (
        <SettingItem
          label={t("settings.tabs.effectCoverage")}
          htmlFor="tab-effect-coverage"
        >
          <SettingRange
            id="tab-effect-coverage"
            label={t("settings.tabs.effectCoverage")}
            min={MIN_TAB_EFFECT_COVERAGE}
            max={MAX_TAB_EFFECT_COVERAGE}
            value={coverage}
            onChange={onCoverageChange}
            accentColor={color}
            editable={false}
            formatValue={(value) => `${value}%`}
          />
        </SettingItem>
      )}
    </>
  )
}
