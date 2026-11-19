import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import ColorPicker from "@/components/ui/color-picker"
import { Switch } from "@/components/ui/switch"
import {
  defaultLiquidGlass,
  liquidGlassFinishes,
  liquidGlassOptics,
  liquidGlassRanges,
  type LiquidGlassSettings,
} from "@/lib/liquid-glass"
import AppearanceTabs from "./appearance-tabs"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import { settingsControlClassName } from "../shared/control-styles"

export default function LiquidGlassSettingsFields({
  color,
  value,
  onChange,
}: {
  color: string
  value: LiquidGlassSettings
  onChange: (patch: Partial<LiquidGlassSettings>) => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const optics = liquidGlassOptics(value)

  const range = (key: keyof typeof liquidGlassRanges, current: number) => {
    const label = t(`settings.material.liquidGlass.${key}`)
    return (
      <SettingItem label={label} htmlFor={`${id}-${key}`}>
        <SettingRange
          id={`${id}-${key}`}
          label={label}
          {...liquidGlassRanges[key]}
          value={current}
          accentColor={color}
          onChange={(next) => onChange({ [key]: next })}
        />
      </SettingItem>
    )
  }

  return (
    <>
      <AppearanceTabs
        label={t("settings.material.liquidGlass.finish")}
        options={liquidGlassFinishes}
        value={value.finish}
        onChange={(finish) => onChange({ finish })}
        getOptionLabel={(finish) =>
          t(`settings.material.liquidGlass.finishes.${finish}`)
        }
      />
      {range("clarity", value.clarity)}
      <SettingItem label={t("settings.material.liquidGlass.tint")}>
        <ColorPicker
          label={t("settings.material.liquidGlass.tint")}
          value={optics.tint}
          className={settingsControlClassName}
          onChange={(tint) => onChange({ tint })}
        />
      </SettingItem>
      <fieldset className="min-w-0 space-y-3 border-t border-ui-border-panel pt-3">
        <legend className="pr-2 text-sm font-medium">
          {t("settings.material.liquidGlass.optics")}
        </legend>
        {range("refraction", optics.refraction)}
        {range("rimWidth", value.rimWidth)}
        {range("blur", optics.blur)}
        {range("saturation", value.saturation)}
      </fieldset>
      <fieldset className="min-w-0 space-y-3 border-t border-ui-border-panel pt-3">
        <legend className="pr-2 text-sm font-medium">
          {t("settings.material.liquidGlass.lighting")}
        </legend>
        <SettingItem
          label={t("settings.material.liquidGlass.sheen")}
          labelId={`${id}-sheen`}
        >
          <Switch
            aria-labelledby={`${id}-sheen`}
            checked={value.sheen}
            className="justify-self-end"
            onCheckedChange={(sheen) =>
              onChange({ sheen, pointerHighlight: optics.pointerHighlight })
            }
          />
        </SettingItem>
        {range("sheenIntensity", optics.sheenIntensity)}
        <SettingItem
          label={t("settings.material.liquidGlass.pointerHighlight")}
          labelId={`${id}-pointer`}
        >
          <Switch
            aria-labelledby={`${id}-pointer`}
            checked={optics.pointerHighlight}
            className="justify-self-end"
            onCheckedChange={(pointerHighlight) =>
              onChange({ pointerHighlight })
            }
          />
        </SettingItem>
        {range("glintIntensity", value.glintIntensity)}
        {range("glintSize", value.glintSize)}
      </fieldset>
      <div className="flex justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => onChange(defaultLiquidGlass)}
        >
          {t("settings.material.liquidGlass.reset")}
        </Button>
      </div>
    </>
  )
}
