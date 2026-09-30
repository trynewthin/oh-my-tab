import { useTranslation } from "react-i18next"
import { Switch } from "@/components/ui/switch"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import EffectStylePicker from "./effect-style-picker"
import { useMaterialPreview } from "./material-preview-context"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"
import { MAX_STAR_TRAIL_SPEED, MIN_STAR_TRAIL_SPEED } from "@/lib/star-trails"

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
  const starTrails = materialPreview.value === "star-trails"
  const controlId = starTrails ? "star-trail-speed" : "burning-amplitude"
  const controlValue = starTrails ? materialPreview.starTrailSpeed : amplitude

  return (
    <div className="space-y-4">
      <SettingItem label={t("settings.material.previewTexture")}>
        <EffectStylePicker
          value={materialPreview.value}
          color={color}
          onChange={materialPreview.setValue}
          labelKey="settings.material.previewTexture"
          opaqueHover
          includeStarTrails
        />
      </SettingItem>
      {starTrails && (
        <SettingItem
          label={t("settings.material.runningMode")}
          labelId="star-trail-mode-label"
        >
          <ToggleGroup
            aria-labelledby="star-trail-mode-label"
            className={settingsControlSurface}
            value={[materialPreview.starTrailMode]}
            onValueChange={(values) => {
              const value = values[0]
              if (value === "dynamic" || value === "static")
                materialPreview.setStarTrailMode(value)
            }}
          >
            <ToggleGroupItem value="dynamic">
              {t("settings.material.dynamic")}
            </ToggleGroupItem>
            <ToggleGroupItem value="static">
              {t("settings.material.static")}
            </ToggleGroupItem>
          </ToggleGroup>
        </SettingItem>
      )}
      {(materialPreview.value === "burning" ||
        materialPreview.value === "particles" ||
        starTrails) && (
        <>
          <SettingItem
            label={
              starTrails
                ? t("settings.material.runningSpeed")
                : materialPreview.value === "burning"
                  ? t("settings.material.burningAmplitude")
                  : t("settings.material.breathingAmplitude")
            }
            htmlFor={controlId}
          >
            <div
              className={`flex h-8 min-w-0 items-center gap-2 rounded-2xl px-3 ${settingsControlSurface}`}
            >
              <input
                id={controlId}
                type="range"
                min={starTrails ? MIN_STAR_TRAIL_SPEED : 0}
                max={starTrails ? MAX_STAR_TRAIL_SPEED : 2}
                step="0.1"
                value={controlValue}
                onChange={(event) => {
                  const value = Number(event.target.value)
                  if (starTrails) materialPreview.setStarTrailSpeed(value)
                  else setAmplitude(value)
                }}
                className="min-w-0 flex-1"
                style={{ accentColor: color }}
              />
              <output
                htmlFor={controlId}
                className="w-10 text-right text-xs tabular-nums"
              >
                {Math.round(controlValue * 100)}%
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
