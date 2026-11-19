import { Check } from "@phosphor-icons/react"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import AppearanceTabs from "./appearance-tabs"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import {
  defaultUiAppearance,
  uiDepthOptions,
  uiRadiusOptions,
} from "@/lib/ui-appearance"
import { useThemeStore } from "@/stores/theme-store"
import AppearancePreviewStage from "./appearance-preview-stage"

const previewCardClassName =
  "absolute -bottom-20 origin-top-left truncate border bg-card px-4 pt-3 font-medium text-card-foreground motion-safe:transition-[border-radius,border-color,box-shadow] motion-safe:duration-300 sm:px-5 sm:pt-4"

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
    <div className="space-y-3 border-b border-border pb-4">
      <div
        id={previewId}
        role="tabpanel"
        aria-label={t("settings.uiAppearance.preview")}
      >
        <AppearancePreviewStage>
          <div
            className={`${previewCardClassName} top-[17%] right-[27%] left-[7%] -rotate-4 rounded-(--ui-radius-window) border-ui-border-window shadow-(--ui-shadow-window)`}
          >
            <div className="flex items-center justify-between gap-2">
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
            <div className="mt-3 grid grid-cols-[2fr_3fr] gap-2 sm:gap-3">
              <div className="flex h-16 flex-col gap-2 rounded-(--ui-radius-control) bg-muted p-2.5">
                <span className="h-1 w-full rounded-full bg-foreground/15" />
                <span className="h-1 w-3/4 rounded-full bg-foreground/10" />
                <span className="h-1 w-4/5 rounded-full bg-foreground/10" />
              </div>
              <div className="h-16 rounded-(--ui-radius-panel) bg-muted/70" />
            </div>
          </div>
          <div
            className={`${previewCardClassName} top-[40%] right-[13%] left-[30%] z-10 -rotate-1 rounded-(--ui-radius-panel) border-ui-border-panel shadow-(--ui-shadow-panel)`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate">
                {t("settings.uiAppearance.panel")}
              </span>
              <Button type="button" variant="outline" size="xs">
                <Check data-icon="inline-start" weight="bold" />
                {t("settings.common.save")}
              </Button>
            </div>
            <div className="mt-2.5 space-y-2">
              <div className="h-1.5 w-2/5 rounded-full bg-foreground/12" />
              <div className="h-8 w-4/5 rounded-(--ui-radius-control) bg-muted" />
            </div>
          </div>
          <div
            className={`${previewCardClassName} top-[65%] right-[5%] left-[55%] z-20 rotate-3 rounded-(--ui-radius-control) border-ui-border-control shadow-(--ui-shadow-control)`}
          >
            {t("settings.uiAppearance.control")}
          </div>
        </AppearancePreviewStage>
      </div>
      <AppearanceTabs
        label={t("settings.uiAppearance.radius")}
        options={uiRadiusOptions}
        value={radius}
        onChange={setRadius}
        previewId={previewId}
      />
      <AppearanceTabs
        label={t("settings.uiAppearance.border")}
        options={uiDepthOptions}
        value={border}
        onChange={setBorder}
        previewId={previewId}
      />
      <AppearanceTabs
        label={t("settings.uiAppearance.shadow")}
        options={uiDepthOptions}
        value={shadow}
        onChange={setShadow}
        previewId={previewId}
      />
    </div>
  )
}
