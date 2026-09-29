import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import EffectStylePicker from "./effect-style-picker"
import { useMaterialPreview } from "./material-preview-context"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"

export default function MaterialPane() {
  const { t } = useTranslation()
  const materialPreview = useMaterialPreview()
  const amplitude = useHomeSettingsStore((state) => state.burningAmplitude)
  const setAmplitude = useHomeSettingsStore(
    (state) => state.setBurningAmplitude
  )
  const entrance = useHomeSettingsStore((state) => state.transitionsEnabled)
  const setEntrance = useHomeSettingsStore(
    (state) => state.setTransitionsEnabled
  )
  const color = useHomeSettingsStore((state) => state.color)

  return (
    <div className="space-y-4 rounded-3xl border border-black/10 bg-white/65 p-4 shadow-lg backdrop-blur-xl sm:p-5 dark:border-white/10 dark:bg-black/55">
      <SettingItem label={t("settings.material.previewTexture")}>
        <EffectStylePicker
          value={materialPreview.value}
          color={color}
          onChange={materialPreview.setValue}
          labelKey="settings.material.previewTexture"
          showStorm
        />
      </SettingItem>
      {(materialPreview.value === "burning" ||
        materialPreview.value === "particles") && (
        <>
          <SettingItem
            label={
              materialPreview.value === "burning"
                ? t("settings.material.burningAmplitude")
                : t("settings.material.breathingAmplitude")
            }
            htmlFor="burning-amplitude"
          >
            <div
              className={`flex h-8 min-w-0 items-center gap-2 rounded-2xl px-3 ${settingsControlSurface}`}
            >
              <input
                id="burning-amplitude"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={amplitude}
                onChange={(event) => setAmplitude(Number(event.target.value))}
                className="min-w-0 flex-1"
                style={{ accentColor: color }}
              />
              <output
                htmlFor="burning-amplitude"
                className="w-10 text-right text-xs tabular-nums"
              >
                {Math.round(amplitude * 100)}%
              </output>
            </div>
          </SettingItem>
          <SettingItem label={t("settings.material.transition")}>
            <Switch
              aria-label={t("settings.material.transition")}
              checked={entrance}
              className={`justify-self-end ${settingsControlSurface} focus-visible:border-ring`}
              style={{ backgroundColor: entrance ? color : undefined }}
              onCheckedChange={setEntrance}
            />
          </SettingItem>
        </>
      )}
    </div>
  )
}
