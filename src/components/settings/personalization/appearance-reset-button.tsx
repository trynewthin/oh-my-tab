import { useState } from "react"
import { useTranslation } from "react-i18next"
import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverTitle,
} from "@/components/ui/popover"

export default function AppearanceResetButton({
  label,
  onReset,
}: {
  label: string
  onReset: () => void
}) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)

  return (
    <div className="mt-auto flex shrink-0 justify-end pt-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger render={<Button type="button" variant="secondary" />}>
          <ArrowCounterClockwise className="size-4" />
          {label}
        </PopoverTrigger>
        <PopoverContent align="end" className="max-w-[calc(100vw-2rem)]">
          <PopoverTitle>
            {t("settings.tabs.appearance.resetActionTitle", { action: label })}
          </PopoverTitle>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
            >
              {t("settings.common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={() => {
                onReset()
                setOpen(false)
              }}
            >
              {t("settings.tabs.appearance.resetConfirm")}
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
