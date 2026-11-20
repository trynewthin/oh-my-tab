import { GlobeSimple } from "@phosphor-icons/react"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { defaultUiAppearance } from "@/lib/ui-appearance"
import { useThemeStore } from "@/stores/theme-store"
import SettingSection from "../shared/setting-section"
import UiAppearanceControls from "./ui-appearance-controls"
import UiAppearancePreview from "./ui-appearance-preview"

export default function UiAppearanceSettings() {
  const { t } = useTranslation()
  const previewId = useId()
  const radius = useThemeStore((state) => state.uiRadius ?? defaultUiAppearance)
  const border = useThemeStore((state) => state.uiBorder ?? defaultUiAppearance)
  const shadow = useThemeStore((state) => state.uiShadow ?? defaultUiAppearance)
  const setRadius = useThemeStore((state) => state.setUiRadius)
  const setBorder = useThemeStore((state) => state.setUiBorder)
  const setShadow = useThemeStore((state) => state.setUiShadow)

  return (
    <div className="space-y-4">
      <UiAppearancePreview
        id={previewId}
        appearance={{ radius, border, shadow }}
      />
      <SettingSection
        title={t("settings.uiAppearance.globalBasicStyles")}
        icon={<GlobeSimple />}
        className="gap-3"
      >
        <UiAppearanceControls
          appearance={{ radius, border, shadow }}
          previewId={previewId}
          onChange={({ radius, border, shadow }) => {
            if (radius !== undefined) setRadius(radius)
            if (border !== undefined) setBorder(border)
            if (shadow !== undefined) setShadow(shadow)
          }}
        />
      </SettingSection>
    </div>
  )
}
