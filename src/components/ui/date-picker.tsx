import { useState } from "react"
import { CalendarBlank } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { enUS, zhCN } from "react-day-picker/locale"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

export default function DatePicker({
  id,
  value,
  onChange,
}: {
  id: string
  value: Date
  onChange: (date: Date) => void
}) {
  const [open, setOpen] = useState(false)
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage?.startsWith("zh") ? zhCN : enUS

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            className="w-full justify-between font-normal"
          />
        }
      >
        {value.toLocaleDateString(locale.code, {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
        <CalendarBlank aria-hidden="true" />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-auto rounded-2xl p-0">
        <Calendar
          mode="single"
          required
          selected={value}
          defaultMonth={value}
          locale={locale}
          startMonth={new Date(1000, 0, 1)}
          endMonth={new Date(9999, 11, 31)}
          autoFocus
          onSelect={(date) => {
            onChange(date)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
