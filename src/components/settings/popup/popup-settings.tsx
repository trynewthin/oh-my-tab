import { useId } from "react"
import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import PopupBookmarkForm from "@/components/popup/popup-bookmark-form"
import PopupSurface from "@/components/popup/popup-surface"
import { Button } from "@/components/ui/button"
import ColorPicker from "@/components/ui/color-picker"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  defaultPopupAppearance,
  popupEffects,
  popupSizeLimits,
} from "@/lib/popup-appearance"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { AppearancePreviewFrame } from "../personalization/appearance-preview-stage"
import AppearanceResetButton from "../personalization/appearance-reset-button"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import { settingsControlClassName } from "../shared/control-styles"

const sizeFields = ["width", "padding"] as const
const effectLabels = {
  inherit: "settings.popup.inheritEffect",
  none: "settings.background.solid",
  burning: "settings.effects.burning",
  particles: "settings.effects.particles",
} as const

export default function PopupSettings() {
  const { t } = useTranslation()
  const id = useId()
  const appearance = useHomeSettingsStore((state) => state.popupAppearance)
  const update = useHomeSettingsStore((state) => state.setPopupAppearance)
  const color = useHomeSettingsStore((state) => state.color)
  const tabTexture = useHomeSettingsStore((state) => state.tabTexture)
  const hasEffect =
    (appearance.effect === "inherit" ? tabTexture : appearance.effect) !==
    "none"
  const colorLabel = t("settings.popup.effectColor")
  const inheritColorLabel = t("settings.popup.inheritColor")

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col gap-4">
      <AppearancePreviewFrame className="shrink-0">
        <div
          role="region"
          aria-label={t("settings.popup.preview")}
          tabIndex={0}
          className="max-h-[min(18rem,42dvh)] overflow-auto p-3 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset"
        >
          <div aria-hidden="true" inert>
            <PopupSurface preview>
              <PopupBookmarkForm
                name={t("settings.popup.exampleName")}
                url="https://example.com"
                submitLabel={t("shell.popup.add")}
              />
            </PopupSurface>
          </div>
        </div>
      </AppearancePreviewFrame>
      <div
        role="region"
        aria-label={t("settings.popup.controls")}
        tabIndex={0}
        className="-mr-4 min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-4 pb-1 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-inset sm:-mr-(--ui-padding-window) sm:pr-(--ui-padding-window)"
      >
        {sizeFields.map((field) => {
          const fieldId = `${id}-${field}`
          const label = t(`settings.popup.${field}`)
          return (
            <SettingItem key={field} label={label} htmlFor={fieldId}>
              <SettingRange
                id={fieldId}
                label={label}
                value={appearance[field]}
                {...popupSizeLimits[field]}
                unit="px"
                accentColor={color}
                onChange={(value) => update({ [field]: value })}
              />
            </SettingItem>
          )
        })}
        <SettingItem
          label={t("settings.popup.background")}
          htmlFor={`${id}-background`}
        >
          <Select
            value={appearance.effect}
            onValueChange={(value) => {
              if (value !== null) update({ effect: value })
            }}
          >
            <SelectTrigger
              id={`${id}-background`}
              className={`w-full min-w-0 ${settingsControlClassName}`}
            >
              <SelectValue>{t(effectLabels[appearance.effect])}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {popupEffects.map((effect) => (
                <SelectItem key={effect} value={effect}>
                  {t(effectLabels[effect])}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </SettingItem>
        <SettingItem label={colorLabel}>
          <div className="flex items-center gap-1.5">
            <ColorPicker
              label={colorLabel}
              value={appearance.color ?? color}
              disabled={!hasEffect}
              onChange={(value) => update({ color: value })}
              className={`flex-1 ${settingsControlClassName}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={inheritColorLabel}
              title={inheritColorLabel}
              disabled={!hasEffect || appearance.color === null}
              onClick={() => update({ color: null })}
            >
              <ArrowCounterClockwise aria-hidden="true" />
            </Button>
          </div>
        </SettingItem>
        <SettingItem
          label={t("settings.popup.animation")}
          htmlFor={`${id}-animation`}
        >
          <div className="flex justify-end">
            <Switch
              id={`${id}-animation`}
              checked={appearance.animated}
              disabled={!hasEffect}
              onCheckedChange={(animated) => update({ animated })}
            />
          </div>
        </SettingItem>
        <AppearanceResetButton
          label={t("settings.popup.reset")}
          onReset={() => update(defaultPopupAppearance)}
        />
      </div>
    </div>
  )
}
