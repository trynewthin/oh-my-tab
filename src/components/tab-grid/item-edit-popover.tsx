import type { ReactNode, RefObject } from "react"
import { useTranslation } from "react-i18next"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"

export default function ItemEditPopover({
  title,
  anchor,
  onClose,
  children,
  dialogOpen = false,
  initialFocus,
  layer,
}: {
  title: string
  anchor: HTMLElement
  onClose: () => void
  children: ReactNode
  dialogOpen?: boolean
  initialFocus?: RefObject<HTMLElement | null>
  layer?: number
}) {
  const { t } = useTranslation()
  return (
    <Popover
      open
      modal={false}
      onOpenChange={(open, details) => {
        if (open) return
        const target = details.event.target
        if (
          dialogOpen ||
          details.reason === "focus-out" ||
          (target instanceof Node && anchor.contains(target))
        ) {
          details.cancel()
          return
        }
        onClose()
      }}
    >
      <PopoverContent
        anchor={anchor}
        side="right"
        align="start"
        sideOffset={12}
        animateFromAnchor
        initialFocus={initialFocus}
        finalFocus={false}
        layer={layer}
        className="max-h-[min(36rem,var(--available-height))] w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-x-hidden overflow-y-auto data-open:animate-none data-closed:animate-none [&_[data-slot=select-trigger]]:rounded-xl [&_[data-slot=select-trigger]]:border-border [&_[data-slot=select-trigger]]:bg-muted [&_input:not([type=file]):not([type=color])]:rounded-xl [&_input:not([type=file]):not([type=color])]:border-border [&_input:not([type=file]):not([type=color])]:bg-muted [&_textarea]:rounded-xl [&_textarea]:border-border [&_textarea]:bg-muted"
      >
        <div className="flex items-center justify-between gap-3">
          <PopoverTitle>{title}</PopoverTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label={t("shell.common.close")}
          >
            <CloseIcon />
          </Button>
        </div>
        {children}
      </PopoverContent>
    </Popover>
  )
}
