import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useId } from "react"
import { useTranslation } from "react-i18next"
import { Check } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

const presets = [
  { color: "#3478f6", nameKey: "blue" },
  { color: "#a58bc6", nameKey: "purple" },
  { color: "#42b883", nameKey: "green" },
  { color: "#50b7bb", nameKey: "cyan" },
  { color: "#e5a449", nameKey: "amber" },
  { color: "#e58d70", nameKey: "coral" },
  { color: "#d783ab", nameKey: "pink" },
  { color: "#9297a5", nameKey: "gray" },
]
export default function ColorPicker({
  value,
  onChange,
  label,
  className,
}: {
  value: string
  onChange: (value: string) => void
  label: string
  className?: string
}) {
  const { t } = useTranslation()
  const id = useId()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className={cn(
              "w-full min-w-0 justify-between bg-popover pr-3 pl-2 dark:bg-popover dark:hover:bg-muted",
              className
            )}
          />
        }
        aria-label={t("shell.colorPicker.select", { label })}
      >
        <span
          className="h-4 w-7 shrink-0 rounded-full"
          style={{ backgroundColor: value }}
        />
        <span className="truncate font-mono text-xs">
          {value.toUpperCase()}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 gap-4 p-4">
        <div
          role="group"
          aria-label={t("shell.colorPicker.presets", { label })}
          className="grid grid-cols-4 place-items-center gap-3"
        >
          {presets.map((preset) => (
            <button
              key={preset.color}
              type="button"
              aria-label={t(`shell.colorPicker.colors.${preset.nameKey}`)}
              aria-pressed={value.toLowerCase() === preset.color}
              className="flex size-8 items-center justify-center rounded-full border border-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ backgroundColor: preset.color }}
              onClick={() => onChange(preset.color)}
            >
              {value.toLowerCase() === preset.color && (
                <Check className="size-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-4 items-center gap-3">
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <input
            id={id}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="size-8 shrink-0 cursor-pointer justify-self-center overflow-hidden rounded-full border border-black/10 bg-transparent p-0 [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:p-0"
          />
          <Input
            key={value}
            aria-label={t("shell.colorPicker.hexValue", { label })}
            defaultValue={value}
            maxLength={7}
            spellCheck={false}
            className="col-span-3 font-mono text-sm"
            onBlur={(event) => {
              const next = event.currentTarget.value.trim()
              if (/^#[0-9a-f]{6}$/i.test(next)) onChange(next.toLowerCase())
              else event.currentTarget.value = value
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault()
                event.currentTarget.blur()
              }
            }}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
