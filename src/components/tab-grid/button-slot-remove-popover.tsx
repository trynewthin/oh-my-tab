import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
} from "@/components/ui/popover"
import type { ButtonSlotControl } from "@/lib/grid/types"
import { systemActionRegistry } from "@/lib/system-actions"
import { useTabGridStore } from "@/stores/tab-grid-store"

export default function ButtonSlotRemovePopover({
  slotId,
  control,
  anchor,
  columns,
  returnFocus,
  onClose,
}: {
  slotId: string
  control: ButtonSlotControl
  anchor: HTMLElement
  columns: number
  returnFocus: HTMLElement | null
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [failed, setFailed] = useState(false)
  function remove(mode: "delete" | "release") {
    const removed = useTabGridStore.getState().removeSlotControl({
      slotId,
      controlId: control.id,
      mode,
      columns,
      buttonName:
        control.kind === "system"
          ? t(systemActionRegistry[control.action].labelKey)
          : "",
    })
    if (removed) onClose()
    else setFailed(true)
  }
  return (
    <Popover
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <PopoverContent
        anchor={anchor}
        side="top"
        sideOffset={8}
        layer={51}
        className="w-64 max-w-[calc(100vw-2rem)]"
        finalFocus={() => {
          if (returnFocus?.isConnected)
            returnFocus.focus({ preventScroll: true })
          return false
        }}
      >
        <PopoverTitle>{t("grid.buttonSlot.remove")}</PopoverTitle>
        <PopoverDescription>
          {t("grid.buttonSlot.removeChoice")}
        </PopoverDescription>
        {failed && (
          <p role="alert" className="text-xs text-destructive">
            {t("grid.buttonSlot.removeFailed")}
          </p>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            className="mr-auto"
            onClick={onClose}
          >
            {t("grid.editor.cancel")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => remove("release")}
          >
            {t("grid.buttonSlot.release")}
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => remove("delete")}
          >
            {t("grid.menu.delete")}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
