import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AppearancePreviewFrame({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      data-appearance-preview
      className={cn(
        "isolate overflow-hidden rounded-(--ui-radius-panel) border border-border bg-muted/60 bg-[radial-gradient(ellipse_at_22%_0%,var(--background),transparent_78%)]",
        className
      )}
      {...props}
    />
  )
}

export default function AppearancePreviewStage({
  children,
}: {
  children: ReactNode
}) {
  return (
    <AppearancePreviewFrame aria-hidden="true" inert>
      <div className="relative mx-auto h-40 max-w-xl text-xs sm:h-48">
        {children}
      </div>
    </AppearancePreviewFrame>
  )
}
