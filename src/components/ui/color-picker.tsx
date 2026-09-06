import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { useId } from "react"
import { Check } from "@phosphor-icons/react"
import { Input } from "@/components/ui/input"

const presets = [
  { color: "#3478f6", name: "蓝色" },
  { color: "#a58bc6", name: "紫色" },
  { color: "#42b883", name: "绿色" },
  { color: "#50b7bb", name: "青色" },
  { color: "#e5a449", name: "琥珀" },
  { color: "#e58d70", name: "珊瑚" },
  { color: "#d783ab", name: "粉色" },
  { color: "#9297a5", name: "灰色" },
]
export default function ColorPicker({
  value,
  onChange,
  label,
}: {
  value: string
  onChange: (value: string) => void
  label: string
}) {
  const id = useId()
  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            className="w-full min-w-0 justify-between bg-popover dark:bg-popover dark:hover:bg-muted"
          />
        }
        aria-label={`选择${label}`}
      >
        <span
          className="size-4 shrink-0 rounded-md"
          style={{ backgroundColor: value }}
        />
        <span className="truncate font-mono text-xs">
          {value.toUpperCase()}
        </span>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-64 space-y-4 p-4">
        <div
          role="group"
          aria-label={`${label}预设`}
          className="grid grid-cols-4 gap-3"
        >
          {presets.map((preset) => (
            <button
              key={preset.color}
              type="button"
              aria-label={preset.name}
              aria-pressed={value.toLowerCase() === preset.color}
              className="flex size-9 items-center justify-center rounded-xl border border-black/10 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              style={{ backgroundColor: preset.color }}
              onClick={() => onChange(preset.color)}
            >
              {value.toLowerCase() === preset.color && (
                <Check className="size-4 text-white drop-shadow" />
              )}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor={id} className="sr-only">
            {label}
          </label>
          <input
            id={id}
            type="color"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="h-9 w-12 shrink-0 cursor-pointer rounded-lg border bg-transparent p-1"
          />
          <Input
            key={value}
            aria-label={`${label}十六进制值`}
            defaultValue={value}
            maxLength={7}
            spellCheck={false}
            className="ml-auto max-w-32 font-mono text-sm"
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
