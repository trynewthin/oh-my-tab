import { Stack } from "@phosphor-icons/react"
import { Fragment, useId } from "react"
import { useTranslation } from "react-i18next"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import {
  materialOptions,
  materialStyles,
  supportsMaterial,
  type MaterialStyle,
} from "@/lib/material"
import {
  defaultSettingsPanelOpacity,
  maxSettingsPanelBlur,
  settingsMaterialPlacements,
  settingsPanelMaterial,
} from "@/lib/ui-appearance"
import { useThemeStore } from "@/stores/theme-store"
import SettingItem from "../shared/setting-item"
import SettingRange from "../shared/setting-range"
import SettingSection from "../shared/setting-section"
import { settingsControlClassName } from "../shared/control-styles"
import SettingsBackgroundMaskSetting from "./settings-background-mask-setting"
import SettingsMaterialEditor from "./settings-material-editor"

const fields = [
  {
    key: "backgroundMaterial",
    slot: "background",
    label: "settings.material.background",
  },
  {
    key: "sidebarMaterial",
    slot: "sidebar",
    label: "settings.material.sidebar",
  },
  {
    key: "controlMaterial",
    slot: "control",
    label: "settings.material.control",
  },
] as const

export default function SettingsMaterialOptions() {
  const { t } = useTranslation()
  const id = useId()
  const appearance = useThemeStore((state) => state.settingsAppearance)
  const update = useThemeStore((state) => state.setSettingsAppearance)
  const titlePanelLabel = t("settings.material.panelTitleBackground")
  const panelFields = [
    {
      key: "panelOpacity",
      label: t("settings.material.panelOpacity"),
      max: 100,
      value: appearance?.panelOpacity ?? defaultSettingsPanelOpacity,
      unit: "%",
    },
    {
      key: "panelBlur",
      label: t("settings.material.panelBlur"),
      max: maxSettingsPanelBlur,
      value: appearance?.panelBlur ?? 0,
      unit: "px",
    },
  ] as const

  return (
    <SettingSection
      title={t("settings.nav.personalizationMaterial")}
      icon={<Stack />}
    >
      {fields.map(({ key, slot, label }) => {
        const fieldId = `${id}-${key}`
        const material = appearance?.[key] ?? "none"
        const items: {
          value: MaterialStyle | typeof settingsPanelMaterial
          label: string
        }[] = materialStyles
          .filter((style) =>
            supportsMaterial(style, settingsMaterialPlacements[key])
          )
          .map((value) => ({
            value,
            label: t(materialOptions[value].labelKey),
          }))
        if (slot === "sidebar") {
          items.push({
            value: settingsPanelMaterial,
            label: t("settings.material.followSettingsPanel"),
          })
        }
        return (
          <Fragment key={key}>
            <SettingItem label={t(label)} labelId={fieldId}>
              <div className="flex min-w-0 items-center gap-2">
                <Select
                  items={items}
                  value={material}
                  onValueChange={(value) => {
                    if (value === settingsPanelMaterial)
                      update({ sidebarMaterial: value })
                    else if (value !== null) update({ [key]: value })
                  }}
                >
                  <SelectTrigger
                    aria-labelledby={fieldId}
                    className={`min-w-0 flex-1 ${settingsControlClassName}`}
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent alignItemWithTrigger={false}>
                    {items.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <SettingsMaterialEditor
                  slot={slot}
                  label={t(label)}
                  material={
                    material === settingsPanelMaterial ? "none" : material
                  }
                  appearance={appearance}
                  onSave={(patch) => {
                    const current =
                      useThemeStore.getState().settingsAppearance
                        ?.materialParameters
                    update({
                      materialParameters: {
                        ...current,
                        [slot]: { ...current?.[slot], ...patch },
                      },
                    })
                  }}
                />
              </div>
            </SettingItem>
            {key === "backgroundMaterial" && (
              <SettingsBackgroundMaskSetting
                material={appearance?.backgroundMaterial ?? "none"}
                mask={appearance?.backgroundMask}
                parameters={appearance?.materialParameters?.background}
                onSave={(backgroundMask) => update({ backgroundMask })}
              />
            )}
          </Fragment>
        )
      })}
      {panelFields.map(({ key, label, max, value, unit }) => (
        <SettingItem key={key} label={label} htmlFor={`${id}-${key}`}>
          <SettingRange
            id={`${id}-${key}`}
            label={label}
            min={0}
            max={max}
            value={value}
            unit={unit}
            editable={false}
            onChange={(next) => update({ [key]: next })}
          />
        </SettingItem>
      ))}
      <SettingItem label={titlePanelLabel} labelId={`${id}-panel-title`}>
        <Switch
          aria-labelledby={`${id}-panel-title`}
          checked={appearance?.panelTitleBackground ?? false}
          className="justify-self-end"
          onCheckedChange={(panelTitleBackground) =>
            update({ panelTitleBackground })
          }
        />
      </SettingItem>
    </SettingSection>
  )
}
