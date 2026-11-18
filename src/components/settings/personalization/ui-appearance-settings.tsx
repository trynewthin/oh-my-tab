import { Tabs } from "@base-ui/react/tabs"
import { Check } from "@phosphor-icons/react"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import {
  defaultUiAppearance,
  uiDepthOptions,
  uiRadiusOptions,
} from "@/lib/ui-appearance"
import { useThemeStore } from "@/stores/theme-store"

const previewCardClassName =
  "absolute -bottom-20 origin-top-left truncate border bg-card px-4 pt-3 font-medium text-card-foreground motion-safe:transition-[border-radius,border-color,box-shadow] motion-safe:duration-300 sm:px-5 sm:pt-4"

function AppearanceTabs<T extends string>({
  label,
  options,
  value,
  onChange,
  previewId,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (value: T) => void
  previewId: string
}) {
  const { t } = useTranslation()
  const id = useId()

  return (
    <SettingItem label={label} labelId={id}>
      <Tabs.Root
        value={value}
        onValueChange={(next) => {
          const option = options.find((option) => option === next)
          if (option !== undefined) onChange(option)
        }}
      >
        <Tabs.List
          aria-labelledby={id}
          className={`flex min-w-0 rounded-(--ui-radius-panel) p-0.5 ${settingsControlSurface}`}
        >
          {options.map((option) => (
            <Tabs.Tab
              key={option}
              value={option}
              aria-controls={previewId}
              className="flex h-7 min-w-0 flex-auto items-center justify-center rounded-(--ui-radius-control) px-1 text-xs font-medium text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-active:bg-background data-active:text-foreground data-active:shadow-(--ui-shadow-control) dark:data-active:bg-input"
            >
              <span className="truncate">
                {t(`settings.uiAppearance.options.${option}`)}
              </span>
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.Root>
    </SettingItem>
  )
}

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
        <div
          aria-hidden="true"
          inert
          className="isolate overflow-hidden rounded-(--ui-radius-panel) border border-border bg-muted/60 bg-[radial-gradient(ellipse_at_22%_0%,var(--background),transparent_78%)]"
        >
          <div className="relative mx-auto h-40 max-w-xl text-xs sm:h-48">
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
          </div>
        </div>
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
