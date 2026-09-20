import { settingsControlClassName } from "../shared/control-styles"
import { CaretDown, Check } from "@phosphor-icons/react"
import EffectSurface from "@/components/effects/effect-surface"
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

function EffectPreview({
  value,
  color,
  textureId,
}: {
  value: EffectStyle
  color: string
  textureId: string
}) {
  return (
    <EffectSurface
      color={color}
      textureId={textureId}
      effectStyle={value}
      coverage={100}
    />
  )
}

export default function EffectStylePicker({
  value,
  color,
  onChange,
  labelKey = "settings.effects.label",
}: {
  value: EffectStyle
  color: string
  onChange: (value: EffectStyle) => void
  labelKey?: string
}) {
  const { t } = useTranslation()
  const label = t(labelKey)
  const current = options.find((option) => option.value === value) ?? options[0]

  return (
    <Popover>
      <PopoverTrigger
        aria-label={t("settings.effects.selectAria", { label })}
        render={
          <Button
            variant="outline"
            className={`w-full min-w-0 justify-between ${settingsControlClassName}`}
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
          {options.map((option) => {
            const selected = option.value === value
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                className="relative isolate h-9 w-full overflow-hidden rounded-xl border border-border/60 text-left shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() => onChange(option.value)}
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
