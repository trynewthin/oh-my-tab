import type { ComponentProps, ReactNode } from "react"
import { cn } from "@/lib/utils"

export function AppearancePreviewFrame({
  className,
  surface = "panel",
  ...props
}: ComponentProps<"div"> & { surface?: "panel" | "sample" }) {
  return (
    <div
      data-appearance-preview
      data-settings-panel={surface === "panel" ? "" : undefined}
      className={cn(
        "isolate overflow-hidden rounded-(--ui-radius-panel) border",
        surface === "sample" &&
          "border-border bg-popover bg-[radial-gradient(ellipse_at_22%_0%,var(--background),transparent_78%)]",
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
