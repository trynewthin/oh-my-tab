import * as React from "react"
import { Popover as PopoverPrimitive } from "@base-ui/react/popover"
import { cn } from "cn"

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger({ ...props }: PopoverPrimitive.Trigger.Props) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

function PopoverContent({
  className,
  align = "center",
  alignOffset = 0,
  side = "bottom",
  sideOffset = 4,
  anchor,
  positionerClassName,
  animateFromAnchor = false,
  ...props
}: PopoverPrimitive.Popup.Props & {
  positionerClassName?: string
  animateFromAnchor?: boolean
} & Pick<
    PopoverPrimitive.Positioner.Props,
    "align" | "alignOffset" | "side" | "sideOffset" | "anchor"
  >) {
  const positionerRef = React.useCallback(
    (element: HTMLDivElement | null) => {
      if (!element || !animateFromAnchor) return
      let frame: number | undefined
      let entrance: Animation | undefined
      const positioned = () => {
        // Floating UI hides the positioner until its first valid coordinates exist.
        if (element.style.opacity === "0" || !element.style.transform) return
        observer.disconnect()
        const popup = element.querySelector<HTMLElement>(
          '[data-slot="popover-content"]'
        )
        if (
          popup &&
          !window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
          const side = element.dataset.side
          const x =
            side === "right" || side === "inline-end"
              ? -8
              : side === "left" || side === "inline-start"
                ? 8
                : 0
          const y = side === "bottom" ? -8 : side === "top" ? 8 : 0
          entrance = popup.animate(
            [
              {
                opacity: 0,
                transform: `translate(${x}px, ${y}px) scale(0.98)`,
              },
              { opacity: 1, transform: "none" },
            ],
            { duration: 180, easing: "cubic-bezier(0.22,1,0.36,1)" }
          )
        }
        // Paint the initial position before enabling transitions for later movement.
        frame = requestAnimationFrame(() => {
          frame = requestAnimationFrame(() => {
            element.dataset.followReady = ""
          })
        })
      }
      const observer = new MutationObserver(positioned)
      observer.observe(element, {
        attributes: true,
        attributeFilter: ["style"],
      })
      positioned()
      return () => {
        observer.disconnect()
        if (frame !== undefined) cancelAnimationFrame(frame)
        entrance?.cancel()
        delete element.dataset.followReady
      }
    },
    [animateFromAnchor]
  )

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Positioner
        ref={positionerRef}
        anchor={anchor}
        align={align}
        alignOffset={alignOffset}
        side={side}
        sideOffset={sideOffset}
        className={cn(
          "isolate z-50",
          animateFromAnchor &&
            "transition-none motion-safe:duration-[260ms] motion-safe:ease-[cubic-bezier(0.22,1,0.36,1)] motion-safe:data-follow-ready:transition-transform",
          positionerClassName
        )}
      >
        <PopoverPrimitive.Popup
          data-slot="popover-content"
          className={cn(
            "z-50 flex w-72 origin-(--transform-origin) flex-col gap-4 rounded-3xl bg-popover p-4 text-sm text-popover-foreground shadow-lg ring-1 ring-foreground/5 outline-hidden duration-100 data-[side=bottom]:slide-in-from-top-2 data-[side=inline-end]:slide-in-from-left-2 data-[side=inline-start]:slide-in-from-right-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 dark:ring-foreground/10 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95",
            className
          )}
          {...props}
        />
      </PopoverPrimitive.Positioner>
    </PopoverPrimitive.Portal>
  )
}

function PopoverHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1 text-sm", className)}
      {...props}
    />
  )
}

function PopoverTitle({ className, ...props }: PopoverPrimitive.Title.Props) {
  return (
    <PopoverPrimitive.Title
      data-slot="popover-title"
      className={cn("text-base font-medium", className)}
      {...props}
    />
  )
}

function PopoverDescription({
  className,
  ...props
}: PopoverPrimitive.Description.Props) {
  return (
    <PopoverPrimitive.Description
      data-slot="popover-description"
      className={cn("text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
}
