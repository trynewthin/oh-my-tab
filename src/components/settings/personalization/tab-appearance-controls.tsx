import { useState, type ReactNode } from "react"
import { Tabs } from "@base-ui/react/tabs"
import { useTranslation } from "react-i18next"
import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import ColorPicker from "@/components/ui/color-picker"
import AppearanceResetButton from "./appearance-reset-button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DEFAULT_TAB_APPEARANCE,
  type TabAppearance,
} from "@/lib/tab-appearance"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import SettingItem from "../shared/setting-item"
import RangeField from "../shared/setting-range"
import { settingsControlClassName } from "../shared/control-styles"

type Option<T extends string = string> = { value: T; labelKey: string }
type FontWeightValue = "400" | "500" | "600" | "700"

const appearance = "settings.tabs.appearance"
const appearanceGroups = [
  "layout",
  "border",
  "background",
  "text",
  "icon",
] as const

const displayOptions: readonly Option<TabAppearance["display"]>[] = [
  { value: "both", labelKey: `${appearance}.displayBoth` },
  { value: "icon", labelKey: `${appearance}.displayIcon` },
  { value: "text", labelKey: `${appearance}.displayText` },
]

const directionOptions: readonly Option<TabAppearance["direction"]>[] = [
  { value: "left", labelKey: `${appearance}.directionLeft` },
  { value: "right", labelKey: `${appearance}.directionRight` },
  { value: "top", labelKey: `${appearance}.directionTop` },
  { value: "bottom", labelKey: `${appearance}.directionBottom` },
]

const justifyOptions: readonly Option<TabAppearance["justify"]>[] = [
  { value: "start", labelKey: `${appearance}.justifyStart` },
  { value: "center", labelKey: `${appearance}.justifyCenter` },
  { value: "end", labelKey: `${appearance}.justifyEnd` },
  { value: "between", labelKey: `${appearance}.justifyBetween` },
]

const alignOptions: readonly Option<TabAppearance["align"]>[] = [
  { value: "start", labelKey: `${appearance}.alignStart` },
  { value: "center", labelKey: `${appearance}.alignCenter` },
  { value: "end", labelKey: `${appearance}.alignEnd` },
]

const borderStyleOptions: readonly Option<TabAppearance["borderStyle"]>[] = [
  { value: "none", labelKey: `${appearance}.borderNone` },
  { value: "solid", labelKey: `${appearance}.borderSolid` },
  { value: "dashed", labelKey: `${appearance}.borderDashed` },
  { value: "dotted", labelKey: `${appearance}.borderDotted` },
]

const backgroundModeOptions: readonly Option<
  TabAppearance["backgroundMode"]
>[] = [
  { value: "default", labelKey: `${appearance}.backgroundDefault` },
  { value: "transparent", labelKey: `${appearance}.backgroundTransparent` },
  { value: "solid", labelKey: `${appearance}.backgroundSolid` },
  { value: "gradient", labelKey: `${appearance}.backgroundGradient` },
]

const fontFamilyOptions: readonly Option<TabAppearance["fontFamily"]>[] = [
  { value: "system", labelKey: `${appearance}.fontSystem` },
  { value: "sans", labelKey: `${appearance}.fontSans` },
  { value: "serif", labelKey: `${appearance}.fontSerif` },
  { value: "mono", labelKey: `${appearance}.fontMono` },
]

const fontWeightOptions: readonly Option<FontWeightValue>[] = [
  { value: "400", labelKey: `${appearance}.fontWeight400` },
  { value: "500", labelKey: `${appearance}.fontWeight500` },
  { value: "600", labelKey: `${appearance}.fontWeight600` },
  { value: "700", labelKey: `${appearance}.fontWeight700` },
]

const textAlignOptions: readonly Option<TabAppearance["textAlign"]>[] = [
  { value: "left", labelKey: `${appearance}.textAlignLeft` },
  { value: "center", labelKey: `${appearance}.textAlignCenter` },
  { value: "right", labelKey: `${appearance}.textAlignRight` },
]

const textOverflowOptions: readonly Option<TabAppearance["textOverflow"]>[] = [
  { value: "ellipsis", labelKey: `${appearance}.overflowEllipsis` },
  { value: "clip", labelKey: `${appearance}.overflowClip` },
]

const iconFitOptions: readonly Option<TabAppearance["iconFit"]>[] = [
  { value: "contain", labelKey: `${appearance}.iconContain` },
  { value: "cover", labelKey: `${appearance}.iconCover` },
]

const layoutKeys = [
  "display",
  "direction",
  "justify",
  "align",
  "paddingX",
  "paddingY",
  "gap",
] as const

const borderKeys = [
  "borderStyle",
  "borderWidth",
  "borderColor",
  "borderOpacity",
  "radius",
] as const

const backgroundKeys = [
  "backgroundMode",
  "backgroundColor",
  "backgroundEndColor",
  "backgroundOpacity",
  "gradientAngle",
  "backgroundBlur",
] as const

const textKeys = [
  "fontFamily",
  "fontSize",
  "fontWeight",
  "textColor",
  "textOpacity",
  "textAlign",
  "lineHeight",
  "letterSpacing",
  "maxLines",
  "textOverflow",
] as const

const iconKeys = ["iconScale", "iconOpacity", "iconRadius", "iconFit"] as const

function defaultsOf<K extends keyof TabAppearance>(
  keys: readonly K[]
): Pick<TabAppearance, K> {
  const patch = {} as Pick<TabAppearance, K>
  for (const key of keys) patch[key] = DEFAULT_TAB_APPEARANCE[key]
  return patch
}

function SelectField<T extends string>({
  id,
  value,
  options,
  onChange,
}: {
  id: string
  value: T
  options: readonly Option<T>[]
  onChange: (value: T) => void
}) {
  const { t } = useTranslation()
  const selected = options.find((option) => option.value === value)

  return (
    <Select
      value={value}
      onValueChange={(next) => {
        const option = options.find((candidate) => candidate.value === next)
        if (option) onChange(option.value)
      }}
    >
      <SelectTrigger
        id={id}
        className={`w-full min-w-0 ${settingsControlClassName}`}
      >
        <SelectValue>{selected ? t(selected.labelKey) : value}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {t(option.labelKey)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ColorModeField({
  id,
  label,
  value,
  inheritValue,
  inheritLabelKey,
  onChange,
}: {
  id: string
  label: string
  value: string
  inheritValue: "theme" | "item"
  inheritLabelKey: string
  onChange: (value: string) => void
}) {
  const { t } = useTranslation()
  const custom = /^#[0-9a-f]{6}$/i.test(value)
  const fallback = DEFAULT_TAB_APPEARANCE.backgroundEndColor

  return (
    <div className="flex min-w-0 flex-col gap-2">
      <Select
        value={custom ? "custom" : inheritValue}
        onValueChange={(next) => {
          if (next === "custom") onChange(custom ? value : fallback)
          else if (next === inheritValue) onChange(inheritValue)
        }}
      >
        <SelectTrigger
          id={id}
          className={`w-full min-w-0 ${settingsControlClassName}`}
        >
          <SelectValue>
            {custom
              ? t("settings.tabs.appearance.colorCustom")
              : t(inheritLabelKey)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={inheritValue}>{t(inheritLabelKey)}</SelectItem>
          <SelectItem value="custom">
            {t("settings.tabs.appearance.colorCustom")}
          </SelectItem>
        </SelectContent>
      </Select>
      {custom && (
        <ColorPicker
          label={label}
          value={value}
          onChange={onChange}
          className={settingsControlClassName}
        />
      )}
    </div>
  )
}

function AppearanceGroup({
  value,
  resetLabel,
  onReset,
  children,
}: {
  value: string
  resetLabel: string
  onReset: () => void
  children: ReactNode
}) {
  return (
    <Tabs.Panel
      value={value}
      className="-mr-4 min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain pr-4 outline-none sm:-mr-6 sm:pr-6"
    >
      <div className="flex min-h-full flex-col gap-3 pt-2 pb-5 sm:pb-6">
        <div className="space-y-3">{children}</div>
        <AppearanceResetButton label={resetLabel} onReset={onReset} />
      </div>
    </Tabs.Panel>
  )
}

export default function TabAppearanceControls({
  preview,
  effects,
}: {
  preview: ReactNode
  effects: ReactNode
}) {
  const { t } = useTranslation()
  const tabAppearance = useHomeSettingsStore((state) => state.tabAppearance)
  const setTabAppearance = useHomeSettingsStore(
    (state) => state.setTabAppearance
  )
  const color = useHomeSettingsStore((state) => state.color)
  const [resetOpen, setResetOpen] = useState(false)

  const resetGroup = (keys: readonly (keyof TabAppearance)[]) => {
    setTabAppearance(defaultsOf(keys))
  }

  return (
    <Tabs.Root
      defaultValue="layout"
      className="-mb-5 flex h-[calc(100%+1.25rem)] min-h-0 flex-col gap-3 sm:-mb-6 sm:h-[calc(100%+1.5rem)]"
    >
      <div className="shrink-0 space-y-3">
        {preview}
        <div className="flex items-stretch gap-2">
          <Tabs.List
            aria-label={t("settings.tabs.appearance.title")}
            className="-ml-3 grid min-w-0 grid-cols-3 gap-x-1 text-sm sm:grid-cols-6"
          >
            {appearanceGroups.map((group) => (
              <Tabs.Tab
                key={group}
                value={group}
                className="relative min-w-0 rounded-sm px-3 py-2 text-center text-muted-foreground transition-colors outline-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-active:text-foreground data-active:after:bg-current"
              >
                {t(`settings.tabs.appearance.groups.${group}`)}
              </Tabs.Tab>
            ))}
            <Tabs.Tab
              value="effects"
              className="relative min-w-0 rounded-sm px-3 py-2 text-center text-muted-foreground transition-colors outline-none after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 data-active:text-foreground data-active:after:bg-current"
            >
              {t("settings.tabs.appearance.groups.effects")}
            </Tabs.Tab>
          </Tabs.List>
          <Popover open={resetOpen} onOpenChange={setResetOpen}>
            <PopoverTrigger
              aria-label={t("settings.tabs.appearance.resetAll")}
              title={t("settings.tabs.appearance.resetAll")}
              render={
                <Button
                  type="button"
                  variant="ghost"
                  className="ml-auto h-auto shrink-0 gap-1.5 self-stretch rounded-lg border-0 px-2.5 text-xs font-normal text-muted-foreground"
                />
              }
            >
              <ArrowCounterClockwise className="size-3.5" />
              <span className="hidden sm:inline">
                {t("settings.tabs.appearance.resetAll")}
              </span>
            </PopoverTrigger>
            <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
              <PopoverTitle>
                {t("settings.tabs.appearance.resetConfirmTitle")}
              </PopoverTitle>
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setResetOpen(false)}
                >
                  {t("settings.common.cancel")}
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    setTabAppearance(DEFAULT_TAB_APPEARANCE)
                    setResetOpen(false)
                  }}
                >
                  {t("settings.tabs.appearance.resetConfirm")}
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <AppearanceGroup
        value="layout"
        resetLabel={t("settings.tabs.appearance.resetGroup", {
          group: t("settings.tabs.appearance.groups.layout"),
        })}
        onReset={() => resetGroup(layoutKeys)}
      >
        <SettingItem
          label={t("settings.tabs.appearance.display")}
          htmlFor="tab-appearance-display"
        >
          <SelectField
            id="tab-appearance-display"
            value={tabAppearance.display}
            options={displayOptions}
            onChange={(display) => setTabAppearance({ display })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.direction")}
          htmlFor="tab-appearance-direction"
        >
          <SelectField
            id="tab-appearance-direction"
            value={tabAppearance.direction}
            options={directionOptions}
            onChange={(direction) => setTabAppearance({ direction })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.justify")}
          htmlFor="tab-appearance-justify"
        >
          <SelectField
            id="tab-appearance-justify"
            value={tabAppearance.justify}
            options={justifyOptions}
            onChange={(justify) => setTabAppearance({ justify })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.align")}
          htmlFor="tab-appearance-align"
        >
          <SelectField
            id="tab-appearance-align"
            value={tabAppearance.align}
            options={alignOptions}
            onChange={(align) => setTabAppearance({ align })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.paddingX")}
          htmlFor="tab-appearance-padding-x"
        >
          <RangeField
            id="tab-appearance-padding-x"
            label={t("settings.tabs.appearance.paddingX")}
            unit="px"
            value={tabAppearance.paddingX}
            min={0}
            max={48}
            accentColor={color}
            onChange={(paddingX) => setTabAppearance({ paddingX })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.paddingY")}
          htmlFor="tab-appearance-padding-y"
        >
          <RangeField
            id="tab-appearance-padding-y"
            label={t("settings.tabs.appearance.paddingY")}
            unit="px"
            value={tabAppearance.paddingY}
            min={0}
            max={48}
            accentColor={color}
            onChange={(paddingY) => setTabAppearance({ paddingY })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.gap")}
          htmlFor="tab-appearance-gap"
        >
          <RangeField
            id="tab-appearance-gap"
            label={t("settings.tabs.appearance.gap")}
            unit="px"
            value={tabAppearance.gap}
            min={0}
            max={48}
            accentColor={color}
            onChange={(gap) => setTabAppearance({ gap })}
          />
        </SettingItem>
      </AppearanceGroup>

      <AppearanceGroup
        value="border"
        resetLabel={t("settings.tabs.appearance.resetGroup", {
          group: t("settings.tabs.appearance.groups.border"),
        })}
        onReset={() => resetGroup(borderKeys)}
      >
        <SettingItem
          label={t("settings.tabs.appearance.borderStyle")}
          htmlFor="tab-appearance-border-style"
        >
          <SelectField
            id="tab-appearance-border-style"
            value={tabAppearance.borderStyle}
            options={borderStyleOptions}
            onChange={(borderStyle) => setTabAppearance({ borderStyle })}
          />
        </SettingItem>
        {tabAppearance.borderStyle !== "none" && (
          <>
            <SettingItem
              label={t("settings.tabs.appearance.borderWidth")}
              htmlFor="tab-appearance-border-width"
            >
              <RangeField
                id="tab-appearance-border-width"
                label={t("settings.tabs.appearance.borderWidth")}
                unit="px"
                value={tabAppearance.borderWidth}
                min={0}
                max={8}
                accentColor={color}
                onChange={(borderWidth) => setTabAppearance({ borderWidth })}
              />
            </SettingItem>
            <SettingItem
              label={t("settings.tabs.appearance.borderColor")}
              htmlFor="tab-appearance-border-color"
            >
              <ColorModeField
                id="tab-appearance-border-color"
                label={t("settings.tabs.appearance.borderColor")}
                value={tabAppearance.borderColor}
                inheritValue="theme"
                inheritLabelKey="settings.tabs.appearance.colorTheme"
                onChange={(borderColor) => setTabAppearance({ borderColor })}
              />
            </SettingItem>
            <SettingItem
              label={t("settings.tabs.appearance.borderOpacity")}
              htmlFor="tab-appearance-border-opacity"
            >
              <RangeField
                id="tab-appearance-border-opacity"
                label={t("settings.tabs.appearance.borderOpacity")}
                unit="%"
                value={tabAppearance.borderOpacity}
                min={0}
                max={100}
                accentColor={color}
                onChange={(borderOpacity) =>
                  setTabAppearance({ borderOpacity })
                }
              />
            </SettingItem>
          </>
        )}
        <SettingItem
          label={t("settings.tabs.appearance.radius")}
          htmlFor="tab-appearance-radius"
        >
          <RangeField
            id="tab-appearance-radius"
            label={t("settings.tabs.appearance.radius")}
            unit="px"
            value={tabAppearance.radius}
            min={0}
            max={48}
            accentColor={color}
            onChange={(radius) => setTabAppearance({ radius })}
          />
        </SettingItem>
      </AppearanceGroup>

      <AppearanceGroup
        value="background"
        resetLabel={t("settings.tabs.appearance.resetGroup", {
          group: t("settings.tabs.appearance.groups.background"),
        })}
        onReset={() => resetGroup(backgroundKeys)}
      >
        <SettingItem
          label={t("settings.tabs.appearance.backgroundMode")}
          htmlFor="tab-appearance-background-mode"
          description={t("settings.tabs.appearance.backgroundModeHint")}
        >
          <SelectField
            id="tab-appearance-background-mode"
            value={tabAppearance.backgroundMode}
            options={backgroundModeOptions}
            onChange={(backgroundMode) => setTabAppearance({ backgroundMode })}
          />
        </SettingItem>
        {(tabAppearance.backgroundMode === "solid" ||
          tabAppearance.backgroundMode === "gradient") && (
          <SettingItem
            label={t("settings.tabs.appearance.backgroundColor")}
            htmlFor="tab-appearance-background-color"
          >
            <ColorModeField
              id="tab-appearance-background-color"
              label={t("settings.tabs.appearance.backgroundColor")}
              value={tabAppearance.backgroundColor}
              inheritValue="item"
              inheritLabelKey="settings.tabs.appearance.colorItem"
              onChange={(backgroundColor) =>
                setTabAppearance({ backgroundColor })
              }
            />
          </SettingItem>
        )}
        <SettingItem
          label={t("settings.tabs.appearance.backgroundOpacity")}
          htmlFor="tab-appearance-background-opacity"
        >
          <RangeField
            id="tab-appearance-background-opacity"
            label={t("settings.tabs.appearance.backgroundOpacity")}
            unit="%"
            value={tabAppearance.backgroundOpacity}
            min={0}
            max={100}
            accentColor={color}
            onChange={(backgroundOpacity) =>
              setTabAppearance({ backgroundOpacity })
            }
          />
        </SettingItem>
        {tabAppearance.backgroundMode === "gradient" && (
          <>
            <SettingItem
              label={t("settings.tabs.appearance.backgroundEndColor")}
            >
              <ColorPicker
                label={t("settings.tabs.appearance.backgroundEndColor")}
                value={tabAppearance.backgroundEndColor}
                onChange={(backgroundEndColor) =>
                  setTabAppearance({ backgroundEndColor })
                }
                className={settingsControlClassName}
              />
            </SettingItem>
            <SettingItem
              label={t("settings.tabs.appearance.gradientAngle")}
              htmlFor="tab-appearance-gradient-angle"
            >
              <RangeField
                id="tab-appearance-gradient-angle"
                label={t("settings.tabs.appearance.gradientAngle")}
                unit="°"
                value={tabAppearance.gradientAngle}
                min={0}
                max={360}
                accentColor={color}
                onChange={(gradientAngle) =>
                  setTabAppearance({ gradientAngle })
                }
              />
            </SettingItem>
          </>
        )}
        <SettingItem
          label={t("settings.tabs.appearance.backgroundBlur")}
          htmlFor="tab-appearance-background-blur"
        >
          <RangeField
            id="tab-appearance-background-blur"
            label={t("settings.tabs.appearance.backgroundBlur")}
            unit="px"
            value={tabAppearance.backgroundBlur}
            min={0}
            max={24}
            accentColor={color}
            onChange={(backgroundBlur) => setTabAppearance({ backgroundBlur })}
          />
        </SettingItem>
      </AppearanceGroup>

      <AppearanceGroup
        value="text"
        resetLabel={t("settings.tabs.appearance.resetGroup", {
          group: t("settings.tabs.appearance.groups.text"),
        })}
        onReset={() => resetGroup(textKeys)}
      >
        <SettingItem
          label={t("settings.tabs.appearance.fontFamily")}
          htmlFor="tab-appearance-font-family"
        >
          <SelectField
            id="tab-appearance-font-family"
            value={tabAppearance.fontFamily}
            options={fontFamilyOptions}
            onChange={(fontFamily) => setTabAppearance({ fontFamily })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.fontSize")}
          htmlFor="tab-appearance-font-size"
        >
          <RangeField
            id="tab-appearance-font-size"
            label={t("settings.tabs.appearance.fontSize")}
            unit="px"
            value={tabAppearance.fontSize}
            min={8}
            max={40}
            accentColor={color}
            onChange={(fontSize) => setTabAppearance({ fontSize })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.fontWeight")}
          htmlFor="tab-appearance-font-weight"
        >
          <SelectField
            id="tab-appearance-font-weight"
            value={String(tabAppearance.fontWeight) as FontWeightValue}
            options={fontWeightOptions}
            onChange={(fontWeight) =>
              setTabAppearance({
                fontWeight: Number(fontWeight) as TabAppearance["fontWeight"],
              })
            }
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.textColor")}
          htmlFor="tab-appearance-text-color"
        >
          <ColorModeField
            id="tab-appearance-text-color"
            label={t("settings.tabs.appearance.textColor")}
            value={tabAppearance.textColor}
            inheritValue="theme"
            inheritLabelKey="settings.tabs.appearance.colorTheme"
            onChange={(textColor) => setTabAppearance({ textColor })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.textOpacity")}
          htmlFor="tab-appearance-text-opacity"
        >
          <RangeField
            id="tab-appearance-text-opacity"
            label={t("settings.tabs.appearance.textOpacity")}
            unit="%"
            value={tabAppearance.textOpacity}
            min={0}
            max={100}
            accentColor={color}
            onChange={(textOpacity) => setTabAppearance({ textOpacity })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.textAlign")}
          htmlFor="tab-appearance-text-align"
        >
          <SelectField
            id="tab-appearance-text-align"
            value={tabAppearance.textAlign}
            options={textAlignOptions}
            onChange={(textAlign) => setTabAppearance({ textAlign })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.lineHeight")}
          htmlFor="tab-appearance-line-height"
        >
          <RangeField
            id="tab-appearance-line-height"
            label={t("settings.tabs.appearance.lineHeight")}
            value={tabAppearance.lineHeight}
            min={1}
            max={2}
            step={0.05}
            accentColor={color}
            onChange={(lineHeight) => setTabAppearance({ lineHeight })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.letterSpacing")}
          htmlFor="tab-appearance-letter-spacing"
        >
          <RangeField
            id="tab-appearance-letter-spacing"
            label={t("settings.tabs.appearance.letterSpacing")}
            unit="px"
            value={tabAppearance.letterSpacing}
            min={-2}
            max={8}
            step={0.1}
            accentColor={color}
            onChange={(letterSpacing) => setTabAppearance({ letterSpacing })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.maxLines")}
          htmlFor="tab-appearance-max-lines"
        >
          <RangeField
            id="tab-appearance-max-lines"
            label={t("settings.tabs.appearance.maxLines")}
            value={tabAppearance.maxLines}
            min={1}
            max={4}
            accentColor={color}
            onChange={(maxLines) =>
              setTabAppearance({
                maxLines: maxLines as TabAppearance["maxLines"],
              })
            }
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.textOverflow")}
          htmlFor="tab-appearance-text-overflow"
        >
          <SelectField
            id="tab-appearance-text-overflow"
            value={tabAppearance.textOverflow}
            options={textOverflowOptions}
            onChange={(textOverflow) => setTabAppearance({ textOverflow })}
          />
        </SettingItem>
      </AppearanceGroup>

      <AppearanceGroup
        value="icon"
        resetLabel={t("settings.tabs.appearance.resetGroup", {
          group: t("settings.tabs.appearance.groups.icon"),
        })}
        onReset={() => resetGroup(iconKeys)}
      >
        <SettingItem
          label={t("settings.tabs.appearance.iconScale")}
          htmlFor="tab-appearance-icon-scale"
          description={t("settings.tabs.appearance.iconScaleHint")}
        >
          <RangeField
            id="tab-appearance-icon-scale"
            label={t("settings.tabs.appearance.iconScale")}
            unit="%"
            value={tabAppearance.iconScale}
            min={25}
            max={200}
            accentColor={color}
            onChange={(iconScale) => setTabAppearance({ iconScale })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.iconOpacity")}
          htmlFor="tab-appearance-icon-opacity"
        >
          <RangeField
            id="tab-appearance-icon-opacity"
            label={t("settings.tabs.appearance.iconOpacity")}
            unit="%"
            value={tabAppearance.iconOpacity}
            min={0}
            max={100}
            accentColor={color}
            onChange={(iconOpacity) => setTabAppearance({ iconOpacity })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.iconRadius")}
          htmlFor="tab-appearance-icon-radius"
        >
          <RangeField
            id="tab-appearance-icon-radius"
            label={t("settings.tabs.appearance.iconRadius")}
            unit="%"
            value={tabAppearance.iconRadius}
            min={0}
            max={50}
            accentColor={color}
            onChange={(iconRadius) => setTabAppearance({ iconRadius })}
          />
        </SettingItem>
        <SettingItem
          label={t("settings.tabs.appearance.iconFit")}
          htmlFor="tab-appearance-icon-fit"
        >
          <SelectField
            id="tab-appearance-icon-fit"
            value={tabAppearance.iconFit}
            options={iconFitOptions}
            onChange={(iconFit) => setTabAppearance({ iconFit })}
          />
        </SettingItem>
      </AppearanceGroup>
      <Tabs.Panel
        value="effects"
        className="-mr-4 min-h-0 flex-1 [scrollbar-gutter:stable] overflow-y-auto overscroll-contain pr-4 outline-none sm:-mr-6 sm:pr-6"
      >
        <div className="flex min-h-full flex-col gap-3 pt-2 pb-5 sm:pb-6 [&>*]:shrink-0">
          {effects}
        </div>
      </Tabs.Panel>
    </Tabs.Root>
  )
}
