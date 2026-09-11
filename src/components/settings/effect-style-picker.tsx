import { CaretDown, Check } from "@phosphor-icons/react"
import EffectSurface from "@/components/effects/effect-surface"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { EffectStyle } from "@/stores/home-settings-store"

const options = [
  { value: "burning", label: "方格燃烧" },
  { value: "particles", label: "呼吸点阵" },
  { value: "none", label: "无" },
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
}: {
  value: EffectStyle
  color: string
  onChange: (value: EffectStyle) => void
}) {
  const current = options.find((option) => option.value === value) ?? options[0]

  return (
    <Popover>
      <PopoverTrigger
        aria-label="选择粒子效果"
        render={
          <Button
            variant="outline"
            className="w-full min-w-0 justify-between bg-muted dark:bg-muted dark:hover:bg-muted/80"
          />
        }
      >
        <span className="truncate text-xs">{current.label}</span>
        <CaretDown className="size-4 shrink-0 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        side="bottom"
        className="w-(--anchor-width) gap-2 rounded-2xl p-2"
      >
        <div role="radiogroup" aria-label="粒子效果" className="grid gap-2">
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
                  {option.label}
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
