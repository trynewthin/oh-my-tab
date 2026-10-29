import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { settingsControlSurface } from "./control-styles"

export default function SettingRange({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit,
  accentColor,
  editable = true,
  formatValue,
  onChange,
}: {
  id: string
  label: string
  value: number
  min: number
  max: number
  step?: number
  unit?: string
  accentColor?: string
  editable?: boolean
  formatValue?: (value: number) => string
  onChange: (value: number) => void
}) {
  const { t } = useTranslation()
  const [draft, setDraft] = useState<string | null>(null)

  function commit(raw: string) {
    const parsed = Number(raw)
    if (raw.trim() === "" || !Number.isFinite(parsed)) return
    const normalized = Number.isInteger(step) ? Math.round(parsed) : parsed
    onChange(Math.min(max, Math.max(min, normalized)))
  }

  return (
    <div
      className={`flex h-8 w-full min-w-0 items-center gap-2 rounded-2xl px-3 transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/30 ${settingsControlSurface}`}
    >
      <input
        id={id}
        type="range"
        aria-label={label}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => {
          const next = Number(event.target.value)
          if (Number.isFinite(next)) onChange(next)
        }}
        className="min-w-0 flex-1 outline-none"
        style={{ accentColor }}
      />
      {editable ? (
        <Input
          type="number"
          inputMode={Number.isInteger(step) ? "numeric" : "decimal"}
          aria-label={t("settings.common.valueLabel", { label })}
          min={min}
          max={max}
          step={step}
          value={draft ?? String(value)}
          onFocus={() => setDraft(String(value))}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={(event) => {
            commit(event.target.value)
            setDraft(null)
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault()
              event.currentTarget.blur()
            }
          }}
          className="h-6 w-14 shrink-0 rounded-none border-0 bg-transparent px-0 text-right text-xs tabular-nums focus-visible:ring-0 md:text-xs"
        />
      ) : (
        <output
          htmlFor={id}
          className="min-w-10 shrink-0 text-right text-xs tabular-nums"
        >
          {formatValue ? formatValue(value) : value}
        </output>
      )}
      {unit && (
        <span
          aria-hidden="true"
          className="shrink-0 text-xs text-muted-foreground"
        >
          {unit}
        </span>
      )}
    </div>
  )
}
