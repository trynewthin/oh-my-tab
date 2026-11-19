import { Sparkle } from "@phosphor-icons/react"
import { useRef, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { LiquidGlassSettings } from "@/lib/liquid-glass"
import MaterialSurface, {
  type FairIsleAppearance,
} from "@/components/effects/material-surface"
import { Button } from "@/components/ui/button"
import { useMaterialPreview } from "@/components/settings/personalization/material-preview-context"
import {
  materialOptions,
  materialPlacements,
  type MaterialAssignments,
  type MaterialPlacement,
} from "@/components/settings/personalization/material-preview-options"

export default function MaterialPlacementPreview({
  color,
  fairIsle,
  liquidGlass,
  backgroundRef,
  cardRef,
  onPan,
  assignments,
  onReset,
}: {
  color: string
  fairIsle: FairIsleAppearance
  liquidGlass: LiquidGlassSettings
  backgroundRef: RefObject<HTMLDivElement | null>
  cardRef: RefObject<HTMLDivElement | null>
  onPan: (x: number, y: number) => void
  assignments: MaterialAssignments
  onReset: () => void
}) {
  const { t } = useTranslation()
  const { starTrailSpeed, starTrailMode } = useMaterialPreview()
  const drag = useRef<{ id: number; x: number; y: number } | null>(null)
  const fairIsleBackground = assignments.background === "fair-isle"
  const glassCard = assignments.card === "liquid-glass"
  const glassControl = assignments.control === "liquid-glass"
  const canPan = fairIsleBackground && !fairIsle.fit
  const clearDrag = () => {
    drag.current = null
  }
  const material = (placement: MaterialPlacement, coverage: number) => {
    const value = assignments[placement]
    if (value === "none") return null
    const starTrails = value === "star-trails"
    return (
      <MaterialSurface
        key={value}
        color={color}
        textureId={`settings-material-preview-${placement}`}
        effectStyle={value}
        coverage={coverage}
        speed={starTrailSpeed}
        animated={!starTrails || starTrailMode === "dynamic"}
        staticFrame={starTrailMode === "static"}
        fairIsle={
          placement === "background"
            ? fairIsle
            : { ...fairIsle, offset: undefined }
        }
        liquidGlass={liquidGlass}
        liquidGlassPointerTarget={backgroundRef}
        entrance
        transparent
      />
    )
  }

  return (
    <div
      data-material-placement-preview
      role="group"
      aria-label={t("settings.material.placementPreview")}
      className="shrink-0 space-y-2"
    >
      <div
        data-material-preview-stage
        className="relative isolate overflow-hidden rounded-(--ui-radius-panel) border border-ui-border-panel"
      >
        <div
          ref={backgroundRef}
          role="region"
          aria-label={t("settings.material.scrollablePreview")}
          tabIndex={0}
          className={cn(
            "h-[clamp(7.5rem,30svh,18rem)] overflow-y-auto overscroll-contain bg-muted outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset dark:bg-background",
            canPan && "cursor-grab touch-pan-y active:cursor-grabbing"
          )}
          onPointerDown={(event) => {
            if (!canPan || event.button !== 0 || !event.isPrimary) return
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            }
          }}
          onPointerMove={(event) => {
            const previous = drag.current
            if (!previous || previous.id !== event.pointerId || !canPan) return
            onPan(event.clientX - previous.x, event.clientY - previous.y)
            drag.current = {
              id: event.pointerId,
              x: event.clientX,
              y: event.clientY,
            }
          }}
          onLostPointerCapture={clearDrag}
        >
          <div
            className={cn(
              "relative",
              fairIsleBackground && fairIsle.fit
                ? "h-full"
                : "h-[calc(100%_+_7rem)]"
            )}
          >
            {material(
              "background",
              assignments.background === "star-trails" ? 90 : 85
            )}
          </div>
        </div>
        <div
          aria-hidden="true"
          inert
          className="pointer-events-none absolute inset-0 grid place-items-center p-3 sm:p-5"
        >
          <div
            ref={cardRef}
            className={cn(
              "relative isolate flex h-3/4 max-h-36 w-full max-w-sm items-center justify-between gap-3 rounded-(--ui-radius-panel) border px-4 text-card-foreground shadow-(--ui-shadow-panel) sm:px-(--ui-padding-window)",
              glassCard
                ? "border-transparent"
                : "border-ui-border-panel bg-card"
            )}
          >
            {material("card", 100)}
            <div className="relative min-w-0 flex-1 space-y-2.5">
              <div className="h-2 w-3/5 max-w-24 rounded-full bg-current/20" />
              <div className="h-1.5 w-4/5 max-w-32 rounded-full bg-current/15" />
            </div>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={cn(
                "relative isolate",
                glassControl
                  ? "border-transparent bg-transparent text-inherit dark:bg-transparent"
                  : "bg-background dark:bg-background"
              )}
            >
              {material("control", 100)}
              <Sparkle className="relative" data-icon="inline-start" />
              <span className="relative">{t("settings.material.control")}</span>
            </Button>
          </div>
        </div>
      </div>
      <div className="flex items-start gap-2">
        <dl className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {materialPlacements.map((placement) => {
            const value = assignments[placement]
            const name = t(materialOptions[value].labelKey)
            return (
              <div
                key={placement}
                className="relative isolate flex h-8 max-w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-(--ui-radius-button) border border-ui-border-control bg-muted px-2.5 text-xs"
                data-material-placement={placement}
              >
                <dt className="shrink-0 text-muted-foreground">
                  {value !== "none" && (
                    <>
                      <MaterialSurface
                        color={color}
                        textureId={`settings-material-summary-${placement}`}
                        effectStyle={value}
                        coverage={100}
                        staticFrame={value === "star-trails"}
                        fairIsle={{
                          texture: fairIsle.texture,
                          stitchSize: Math.min(fairIsle.stitchSize, 4),
                        }}
                        liquidGlass={liquidGlass}
                        liquidGlassSample
                        transparent
                      />
                      <span
                        aria-hidden="true"
                        className="absolute inset-0 bg-muted/55 backdrop-blur-[2px]"
                      />
                    </>
                  )}
                  <span className="relative">
                    {t(`settings.material.${placement}`)}
                  </span>
                </dt>
                <dd className="relative truncate font-medium" title={name}>
                  {name}
                </dd>
              </div>
            )
          })}
        </dl>
        <Button
          type="button"
          variant="outline"
          size="default"
          aria-label={t("settings.material.resetPreview")}
          onClick={onReset}
        >
          {t("settings.material.reset")}
        </Button>
      </div>
    </div>
  )
}
