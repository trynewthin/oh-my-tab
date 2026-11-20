import { useTranslation } from "react-i18next"
import {
  defaultUiAppearance,
  uiDepthOptions,
  uiRadiusOptions,
  type UiAppearanceOverrides,
} from "@/lib/ui-appearance"
import AppearanceTabs from "./appearance-tabs"

export default function UiAppearanceControls({
  appearance,
  onChange,
  previewId,
}: {
  appearance: UiAppearanceOverrides
  onChange: (patch: UiAppearanceOverrides) => void
  previewId?: string
}) {
  const { t } = useTranslation()

  return (
    <>
      <AppearanceTabs
        label={t("settings.uiAppearance.radius")}
        options={uiRadiusOptions}
        value={appearance.radius ?? defaultUiAppearance}
        onChange={(radius) => onChange({ radius })}
        previewId={previewId}
      />
      <AppearanceTabs
        label={t("settings.uiAppearance.border")}
        options={uiDepthOptions}
        value={appearance.border ?? defaultUiAppearance}
        onChange={(border) => onChange({ border })}
        previewId={previewId}
      />
      <AppearanceTabs
        label={t("settings.uiAppearance.shadow")}
        options={uiDepthOptions}
        value={appearance.shadow ?? defaultUiAppearance}
        onChange={(shadow) => onChange({ shadow })}
        previewId={previewId}
      />
    </>
  )
}
