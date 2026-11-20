import { Check } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import SettingsMaterialSurface from "../settings-material-surface"
import {
  settingsPanelMaterial,
  uiAppearanceAttributes,
  type SettingsAppearance,
  type UiAppearanceOverrides,
} from "@/lib/ui-appearance"
import AppearancePreviewStage from "./appearance-preview-stage"

const previewCardClassName =
  "absolute -bottom-20 origin-top-left truncate border px-4 pt-3 font-medium text-card-foreground motion-safe:transition-[border-radius,border-color,box-shadow] motion-safe:duration-300 sm:px-5 sm:pt-4"

export default function UiAppearancePreview({
  id,
  appearance,
  settingsMaterials,
}: {
  id: string
  appearance?: UiAppearanceOverrides
  settingsMaterials?: SettingsAppearance
}) {
  const { t } = useTranslation()
  const background = settingsMaterials?.backgroundMaterial
  const sidebar = settingsMaterials?.sidebarMaterial
  const sidebarTranslucent =
    sidebar === "liquid-glass" || sidebar === settingsPanelMaterial

  return (
    <div
      id={id}
      role="tabpanel"
      aria-label={t("settings.uiAppearance.preview")}
      data-global-ui-preview={appearance ? "" : undefined}
      {...uiAppearanceAttributes(appearance)}
    >
      <AppearancePreviewStage>
        <div
          className={`${previewCardClassName} top-[17%] right-[27%] left-[7%] -rotate-4 rounded-(--ui-radius-window) border-ui-border-window bg-card shadow-(--ui-shadow-window)`}
        >
          {background && background !== "none" && (
            <SettingsMaterialSurface
              placement="background"
              material={background}
              backgroundMask={settingsMaterials?.backgroundMask}
              parameters={settingsMaterials?.materialParameters?.background}
            />
          )}
          <div className="relative flex items-center justify-between gap-2">
            <span className="truncate">
              {t("settings.uiAppearance.window")}
            </span>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              aria-label={t("settings.common.close")}
            >
              <CloseIcon className="size-3" />
            </Button>
          </div>
          <div className="relative mt-3 grid grid-cols-[2fr_3fr] gap-2 sm:gap-3">
            <div className="flex h-16 flex-col gap-2 rounded-(--ui-radius-control) bg-muted p-2.5">
              <span className="h-1 w-full rounded-full bg-foreground/15" />
              <span className="h-1 w-3/4 rounded-full bg-foreground/10" />
              <span className="h-1 w-4/5 rounded-full bg-foreground/10" />
            </div>
            <div className="h-16 rounded-(--ui-radius-panel) bg-muted/70" />
          </div>
        </div>
        <div
          className={`${previewCardClassName} top-[40%] right-[13%] left-[30%] z-10 -rotate-1 rounded-(--ui-radius-panel) border-ui-border-panel shadow-(--ui-shadow-panel) ${sidebarTranslucent ? "" : "bg-card"}`}
        >
          {sidebar && sidebar !== "none" && (
            <SettingsMaterialSurface
              placement="sidebar"
              material={sidebar}
              parameters={settingsMaterials?.materialParameters?.sidebar}
              panelOpacity={settingsMaterials?.panelOpacity}
              panelBlur={settingsMaterials?.panelBlur}
            />
          )}
          <div className="relative flex items-center justify-between gap-2">
            <span className="truncate">
              {t(
                settingsMaterials
                  ? "settings.material.sidebar"
                  : "settings.uiAppearance.panel"
              )}
            </span>
            <Button type="button" variant="outline" size="xs">
              <Check data-icon="inline-start" weight="bold" />
              {t("settings.common.save")}
            </Button>
          </div>
          <div className="relative mt-2.5 space-y-2">
            <div className="h-1.5 w-2/5 rounded-full bg-foreground/12" />
            <div className="h-8 w-4/5 rounded-(--ui-radius-control) bg-muted" />
          </div>
        </div>
        <div
          data-settings-material-control
          className={`${previewCardClassName} top-[65%] right-[5%] left-[55%] z-20 rotate-3 rounded-(--ui-radius-control) border-ui-border-control bg-card shadow-(--ui-shadow-control)`}
        >
          {t("settings.uiAppearance.control")}
        </div>
      </AppearancePreviewStage>
    </div>
  )
}
