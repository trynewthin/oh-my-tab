import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ReactNode,
} from "react"
import { cn } from "@/lib/utils"

export const COLLECTION_ROW_HEIGHT = 48
export const COLLECTION_ROW_GAP = 8
export const COLLECTION_ROW_STEP = COLLECTION_ROW_HEIGHT + COLLECTION_ROW_GAP

export const CollectionViewport = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<"div"> & { expanded?: boolean; label?: string }
>(function CollectionViewport(
  { expanded = false, label, className, children, onKeyDown, ...props },
  ref
) {
  return (
    <div
      ref={ref}
      role={label ? "region" : undefined}
      aria-label={label}
      tabIndex={expanded ? 0 : undefined}
      className={cn(
        "min-h-0 flex-1 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain rounded-xl [overflow-anchor:none] [&::-webkit-scrollbar]:hidden",
        expanded &&
          "min-h-24 outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className
      )}
      onKeyDown={(event) => {
        onKeyDown?.(event)
        if (
          !expanded ||
          event.defaultPrevented ||
          event.target !== event.currentTarget
        )
          return
        const top =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? event.currentTarget.scrollHeight
              : event.key === "ArrowDown"
                ? event.currentTarget.scrollTop + COLLECTION_ROW_STEP
                : event.key === "ArrowUp"
                  ? event.currentTarget.scrollTop - COLLECTION_ROW_STEP
                  : null
        if (top === null) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.scrollTo({ top })
      }}
      {...props}
    >
      {children}
    </div>
  )
})

export function CollectionGrid({
  children,
  expanded = false,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & {
  children: ReactNode
  expanded?: boolean
}) {
  return (
    <div
      role="list"
      className={cn(
        expanded && "grid grid-cols-2 gap-2 lg:grid-cols-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CollectionRow({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"div"> & { children: ReactNode }) {
  return (
    <div
      data-stack-row
      role="listitem"
      className={cn("h-12 min-w-0", className)}
      {...props}
    >
      {children}
    </div>
  )
}
