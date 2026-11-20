import { cn } from "cn"
import { useCallback, useContext, type ReactNode } from "react"
import {
  AppWindowExpansionContext,
  type AppWindowPhase,
} from "@/components/application/app-window-expansion"
import {
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import type { AppId } from "@/lib/apps/ids"
import "./app-window-frame.css"

export default function AppWindowFrame({
  id,
  title,
  description,
  className,
  phase = "ready",
  background,
  children,
}: {
  id: AppId
  title: string
  description?: string
  className?: string
  phase?: AppWindowPhase
  background?: ReactNode
  children: ReactNode
}) {
  const registerPopup = useContext(AppWindowExpansionContext)
  const connectPopup = useCallback(
    (popup: HTMLDivElement | null) => {
      if (popup) registerPopup?.(popup, phase)
    },
    [phase, registerPopup]
  )

  return (
    <DialogContent
      ref={connectPopup}
      data-app-window={id}
      showCloseButton={false}
      inPortal
      className={cn("isolate gap-0 overflow-hidden p-0", className)}
      onAnimationEnd={(event) => {
        if (
          event.target === event.currentTarget &&
          event.animationName === "app-window-expand"
        )
          event.currentTarget.dataset.appWindowExpansion = "done"
      }}
    >
      <DialogTitle className="sr-only">{title}</DialogTitle>
      {description && (
        <DialogDescription className="sr-only">{description}</DialogDescription>
      )}
      {background && (
        <div
          aria-hidden="true"
          inert
          className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
        >
          {background}
        </div>
      )}
      <div
        data-app-window-content
        className="relative z-10 flex min-h-0 min-w-0 flex-col"
      >
        {children}
      </div>
    </DialogContent>
  )
}
