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
    const backdrop = backdropRef.current
    if (!popup || !backdrop) return
    let frame: number | undefined
    let moving = false
    const update = () => {
      const panel = (popup.parentElement ?? popup).getBoundingClientRect()
      const target = anchor.getBoundingClientRect()
      const reach = Math.min(420, Math.max(180, window.innerWidth * 0.28))
      const width = panel.width + reach * 2
      const height = panel.height + reach * 2
      const padding = 8
      const radius =
        Math.min(
          Number.parseFloat(getComputedStyle(anchor).borderTopLeftRadius) || 0,
          target.width / 2,
          target.height / 2
        ) + padding
      // One continuous alpha mask avoids seams between backdrop-filter layers.
      const mask = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
        <defs>
          <radialGradient id="fog">
            <stop offset="0" stop-color="white"/>
            <stop offset="0.35" stop-color="white" stop-opacity="0.95"/>
            <stop offset="0.68" stop-color="white" stop-opacity="0.5"/>
            <stop offset="1" stop-color="white" stop-opacity="0"/>
          </radialGradient>
          <filter id="feather" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4"/>
          </filter>
          <mask id="target" maskUnits="userSpaceOnUse" x="0" y="0" width="${width}" height="${height}" style="mask-type:luminance">
            <rect width="${width}" height="${height}" fill="white"/>
            <rect x="${target.left - panel.left + reach - padding}" y="${target.top - panel.top + reach - padding}" width="${target.width + padding * 2}" height="${target.height + padding * 2}" rx="${radius}" fill="black" filter="url(#feather)"/>
          </mask>
        </defs>
        <rect width="${width}" height="${height}" fill="url(#fog)" mask="url(#target)"/>
      </svg>`
      Object.assign(backdrop.style, {
        left: `${panel.left - reach}px`,
        top: `${panel.top - reach}px`,
        width: `${width}px`,
        height: `${height}px`,
        maskImage: `url("data:image/svg+xml,${encodeURIComponent(mask)}")`,
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
    resize.observe(anchor)
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
        {createPortal(
          <div
            ref={backdropRef}
            aria-hidden="true"
            className="item-edit-backdrop"
            style={{ zIndex: (layer ?? 50) - 1 }}
          />,
          document.body
        )}
        {children}
      </PopoverContent>
    </Popover>
  )
}
