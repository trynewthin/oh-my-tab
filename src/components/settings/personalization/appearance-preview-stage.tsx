import type { ReactNode } from "react"

export default function AppearancePreviewStage({
  children,
}: {
  children: ReactNode
}) {
  return (
    <div
      data-appearance-preview
      aria-hidden="true"
      inert
      className="isolate overflow-hidden rounded-(--ui-radius-panel) border border-border bg-muted/60 bg-[radial-gradient(ellipse_at_22%_0%,var(--background),transparent_78%)]"
    >
      <div className="relative mx-auto h-40 max-w-xl text-xs sm:h-48">
        {children}
      </div>
    </div>
  )
}
