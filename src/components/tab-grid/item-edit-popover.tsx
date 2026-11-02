import {
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react"
import { createPortal } from "react-dom"
import { useTranslation } from "react-i18next"
import { Popover, PopoverContent, PopoverTitle } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import CloseIcon from "@/components/ui/close-icon"
import "./item-edit-popover.css"

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
  const [popup, setPopup] = useState<HTMLElement | null>(null)
  const backdropRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    anchor.setAttribute("data-item-edit-target", "")
    return () => anchor.removeAttribute("data-item-edit-target")
  }, [anchor])
  useLayoutEffect(() => {
    const backdrop = backdropRef.current
    const host = anchor.parentElement
    if (!popup || !backdrop || !host) return
    let frame: number | undefined
    let moving = false
    const update = () => {
      const panel = (popup.parentElement ?? popup).getBoundingClientRect()
      const parent = host.getBoundingClientRect()
      const scaleX = parent.width / (host.offsetWidth || parent.width || 1) || 1
      const scaleY =
        parent.height / (host.offsetHeight || parent.height || 1) || 1
      Object.assign(backdrop.style, {
        left: `${(panel.left - parent.left) / scaleX - host.clientLeft + host.scrollLeft}px`,
        top: `${(panel.top - parent.top) / scaleY - host.clientTop + host.scrollTop}px`,
        width: `${panel.width / scaleX}px`,
        height: `${panel.height / scaleY}px`,
      })
      backdrop.setAttribute("data-ready", "")
      if (moving) frame = requestAnimationFrame(update)
      else frame = undefined
    }
    const schedule = () => {
      if (frame === undefined) frame = requestAnimationFrame(update)
    }
    const startMoving = (event: TransitionEvent) => {
      if (
        event.target !== popup.parentElement ||
        event.propertyName !== "transform"
      )
        return
      moving = true
      schedule()
    }
    const stopMoving = (event: TransitionEvent) => {
      if (
        event.target !== popup.parentElement ||
        event.propertyName !== "transform"
      )
        return
      moving = false
      schedule()
    }
    const resize = new ResizeObserver(schedule)
    resize.observe(popup)
    resize.observe(host)
    const position = new MutationObserver(schedule)
    const positioner = popup.parentElement
    if (positioner) {
      position.observe(positioner, {
        attributes: true,
        attributeFilter: ["style"],
      })
      positioner.addEventListener("transitionrun", startMoving)
      positioner.addEventListener("transitionend", stopMoving)
      positioner.addEventListener("transitioncancel", stopMoving)
    }
    window.addEventListener("resize", schedule)
    window.addEventListener("scroll", schedule, true)
    update()
    return () => {
      resize.disconnect()
      position.disconnect()
      positioner?.removeEventListener("transitionrun", startMoving)
      positioner?.removeEventListener("transitionend", stopMoving)
      positioner?.removeEventListener("transitioncancel", stopMoving)
      window.removeEventListener("resize", schedule)
      window.removeEventListener("scroll", schedule, true)
      if (frame !== undefined) cancelAnimationFrame(frame)
      backdrop.removeAttribute("data-ready")
    }
  }, [anchor, popup])
  function focusEditor(popup: HTMLElement) {
    setPopup(popup)
    const target = initialFocus?.current ?? popup
    target.focus({ preventScroll: true })
  }
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
        initialFocus={false}
        onPositioned={focusEditor}
        finalFocus={false}
        layer={layer}
        className="relative max-h-[min(36rem,var(--available-height))] w-80 max-w-[calc(100vw-2rem)] gap-4 overflow-x-hidden overflow-y-auto data-open:animate-none data-closed:animate-none [&_[data-slot=select-trigger]]:rounded-xl [&_[data-slot=select-trigger]]:bg-muted [&_input:not([type=file]):not([type=color])]:rounded-xl [&_input:not([type=file]):not([type=color])]:bg-muted [&_textarea]:rounded-xl [&_textarea]:bg-muted"
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
        {anchor.parentElement &&
          createPortal(
            <div
              ref={backdropRef}
              aria-hidden="true"
              className="item-edit-backdrop"
            >
              <span />
              <span />
              <span />
            </div>,
            anchor.parentElement
          )}
        {children}
      </PopoverContent>
    </Popover>
  )
}
