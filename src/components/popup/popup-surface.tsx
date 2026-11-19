import type { ReactNode } from "react"
import EffectSurface from "@/components/effects/effect-surface"
import { appEnvironment } from "@/lib/app-environment"
import { defaultPopupAppearance } from "@/lib/popup-appearance"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { cn } from "@/lib/utils"

export default function PopupSurface({
  children,
  loading = false,
  preview = false,
}: {
  children?: ReactNode
  loading?: boolean
  preview?: boolean
}) {
  const savedAppearance = useHomeSettingsStore((state) => state.popupAppearance)
  const color = useHomeSettingsStore((state) => state.color)
  const tabTexture = useHomeSettingsStore((state) => state.tabTexture)
  const appearance =
    preview || appEnvironment.hasToolbarPopup
      ? savedAppearance
      : defaultPopupAppearance
  const effect =
    appearance.effect === "inherit" ? tabTexture : appearance.effect
  const Surface = preview ? "div" : "main"

  return (
    <Surface
      className={cn(
        "relative isolate min-h-28 overflow-hidden bg-background",
        preview &&
          "mx-auto max-w-full rounded-(--ui-radius-panel) shadow-(--ui-shadow-panel)"
      )}
      style={{ width: appearance.width, padding: appearance.padding }}
      aria-busy={loading}
    >
      {effect !== "none" && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
        >
          <EffectSurface
            color={appearance.color ?? color}
            effectStyle={effect}
            textureId="popup-background"
            animated={appearance.animated}
            entrance={appearance.animated && !preview}
          />
        </div>
      )}
      {children}
    </Surface>
  )
}
