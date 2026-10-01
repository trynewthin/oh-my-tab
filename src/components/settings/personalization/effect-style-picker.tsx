import { rovingIndex } from "@/lib/roving-index"
import type { KeyboardEvent } from "react"
import { settingsControlClassName } from "../shared/control-styles"
import { CaretDown, Check } from "@phosphor-icons/react"
import MaterialSurface from "@/components/effects/material-surface"
import type { MaterialStyle } from "@/components/effects/material-surface"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useTranslation } from "react-i18next"
import type { EffectStyle } from "@/stores/home-settings-store"

const options = [
  { value: "burning", labelKey: "settings.effects.burning" },
  { value: "particles", labelKey: "settings.effects.particles" },
  { value: "none", labelKey: "settings.effects.none" },
] as const

export type EffectPickerValue = MaterialStyle

type PickerProps = {
  color: string
  labelKey?: string
  opaqueHover?: boolean
  presentation?: "menu" | "swatches"
} & (
  | {
      includeStarTrails: true
      value: EffectPickerValue
      onChange: (value: EffectPickerValue) => void
    }
  | {
      includeStarTrails?: false
      value: EffectStyle
      onChange: (value: EffectStyle) => void
    }
)

function EffectPreview({
  value,
  color,
  textureId,
}: {
  value: EffectPickerValue
  color: string
  textureId: string
}) {
  return (
    <MaterialSurface
      color={color}
      textureId={textureId}
      effectStyle={value}
      coverage={100}
      animated={false}
      staticFrame={value === "star-trails"}
    />
  )
}

export default function EffectStylePicker(props: PickerProps) {
  const {
    value,
    color,
    labelKey = "settings.effects.label",
    opaqueHover = false,
  } = props
  const { t } = useTranslation()
  const label = t(labelKey)
  const choices = props.includeStarTrails
    ? [
        ...options.slice(0, -1),
        {
          value: "star-trails",
          labelKey: "settings.effects.starTrails",
        } as const,
        options[options.length - 1],
      ]
    : options
  const current = choices.find((option) => option.value === value) ?? choices[0]

  function select(next: EffectPickerValue) {
    if (next === "star-trails") {
      if (props.includeStarTrails) props.onChange(next)
    } else props.onChange(next)
  }

  function navigate(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const next = rovingIndex(event.key, index, choices.length, true)
    if (next === null) return
    event.preventDefault()
    select(choices[next].value)
    event.currentTarget.parentElement
      ?.querySelector<HTMLElement>(`[data-effect-index="${next}"]`)
      ?.focus()
  }

  if (props.presentation === "swatches")
    return (
      <div className="material-swatches" role="radiogroup" aria-label={label}>
        {choices.map((option, index) => (
          <button
            key={option.value}
            type="button"
            role="radio"
            data-effect-index={index}
            aria-checked={value === option.value}
            tabIndex={value === option.value ? 0 : -1}
            className="material-swatch"
            onClick={() => select(option.value)}
            onKeyDown={(event) => navigate(event, index)}
          >
            <span className="material-swatch-art" aria-hidden="true">
              <EffectPreview
                value={option.value}
                color={color}
                textureId={`material-swatch-${option.value}`}
              />
            </span>
            <span className="material-swatch-label">
              {t(option.labelKey)}
              <span className="material-swatch-check" aria-hidden="true">
                {value === option.value && <Check />}
              </span>
            </span>
          </button>
        ))}
      </div>
    )

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("settings.effects.selectAria", { label })}
        render={
          <Button
            variant="outline"
            className={`w-full min-w-0 justify-between ${settingsControlClassName} ${opaqueHover ? "hover:!bg-muted dark:hover:!bg-muted" : ""}`}
          />
        }
      >
        <span className="truncate text-xs">{t(current.labelKey)}</span>
        <CaretDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-(--anchor-width) gap-2 rounded-2xl p-2"
      >
        <div role="radiogroup" aria-label={label} className="grid gap-2">
          {choices.map((option) => {
            const selected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className="relative isolate h-9 w-full overflow-hidden rounded-xl border border-border/60 text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => {
                  if (option.value === "star-trails") {
                    if (props.includeStarTrails) props.onChange(option.value)
                  } else props.onChange(option.value)
                }}
              >
                <EffectPreview
                  value={option.value}
                  color={color}
                  textureId={`effect-option-${option.value}`}
                />
                <span className="pointer-events-none absolute inset-0 z-10 flex items-center justify-between px-3 text-sm font-medium">
                  {t(option.labelKey)}
                  {selected && <Check className="size-4" />}
                </span>
              </button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
