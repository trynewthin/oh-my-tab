import { SlidersHorizontal } from "@phosphor-icons/react"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { useThemeStore } from "@/stores/theme-store"
import { settingsControlClassName } from "../shared/control-styles"
import SettingSection from "../shared/setting-section"
import UiAppearanceControls from "./ui-appearance-controls"
import UiAppearancePreview from "./ui-appearance-preview"
import SettingsMaterialOptions from "./settings-material-options"

export default function SettingsAppearance() {
  const { t } = useTranslation()
  const previewId = useId()
  const appearance = useThemeStore((state) => state.settingsAppearance)
  const update = useThemeStore((state) => state.setSettingsAppearance)
  const globalRadius = useThemeStore((state) => state.uiRadius)
  const globalBorder = useThemeStore((state) => state.uiBorder)
  const globalShadow = useThemeStore((state) => state.uiShadow)
  const hasOverrides =
    appearance?.radius !== undefined ||
    appearance?.border !== undefined ||
    appearance?.shadow !== undefined

  return (
    <div className="space-y-4">
      <UiAppearancePreview
        id={previewId}
        settingsMaterials={appearance ?? {}}
      />
      <SettingSection
        title={t("settings.uiAppearance.basicStyles")}
        icon={<SlidersHorizontal />}
        className="gap-3"
        actions={
          <Button
            type="button"
            variant="outline"
            className={settingsControlClassName}
            disabled={!hasOverrides}
            onClick={() =>
              update({
                radius: undefined,
                border: undefined,
                shadow: undefined,
              })
            }
          >
            {t("settings.uiAppearance.followGlobal")}
          </Button>
        }
      >
        <UiAppearanceControls
          appearance={{
            radius: appearance?.radius ?? globalRadius,
            border: appearance?.border ?? globalBorder,
            shadow: appearance?.shadow ?? globalShadow,
          }}
          onChange={update}
          previewId={previewId}
        />
      </SettingSection>
      <SettingsMaterialOptions />
    </div>
  )
}
