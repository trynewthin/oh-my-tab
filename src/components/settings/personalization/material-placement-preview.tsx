import { CaretDown, CaretUp, Sparkle } from "@phosphor-icons/react"
import { useId, useRef, type RefObject } from "react"
import { useTranslation } from "react-i18next"
import { cn } from "@/lib/utils"
import type { LiquidGlassSettings } from "@/lib/liquid-glass"
import MaterialSurface, {
  type FairIsleAppearance,
  type MaterialStyle,
} from "@/components/effects/material-surface"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select"
import { AppearancePreviewFrame } from "@/components/settings/personalization/appearance-preview-stage"
import { useMaterialPreview } from "@/components/settings/personalization/material-preview-context"
import {
  materialOptions,
  materialPlacements,
  materialStyles,
  type MaterialAssignments,
  type MaterialPlacement,
} from "@/lib/material"

const placementControlSurface =
  "border-ui-border-control bg-muted bg-clip-padding dark:bg-muted"

export default function MaterialPlacementPreview({
  color,
  fairIsle,
  liquidGlass,
  backgroundRef,
  cardRef,
  onPan,
  catalogId,
  catalogExpanded,
  onToggleCatalog,
  assignments,
  onAssign,
  onEdit,
  onReset,
}: {
  color: string
  fairIsle: FairIsleAppearance
  liquidGlass: LiquidGlassSettings
  backgroundRef: RefObject<HTMLDivElement | null>
  cardRef: RefObject<HTMLDivElement | null>
  onPan: (x: number, y: number) => void
  catalogId: string
  catalogExpanded: boolean
  onToggleCatalog: () => void
  assignments: MaterialAssignments
  onAssign: (placement: MaterialPlacement, style: MaterialStyle) => void
  onEdit: (placement: MaterialPlacement) => void
  onReset: () => void
}) {
  const { t } = useTranslation()
  const id = useId()
  const catalogToggleLabel = t(
    catalogExpanded
      ? "settings.material.collapseCatalog"
      : "settings.material.expandCatalog"
  )
  const CatalogIcon = catalogExpanded ? CaretUp : CaretDown
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
      <AppearancePreviewFrame data-material-preview-stage className="relative">
        <div
          ref={backgroundRef}
          role="region"
          aria-label={t("settings.material.scrollablePreview")}
          tabIndex={0}
          className={cn(
            "h-[clamp(7.5rem,30svh,18rem)] overflow-y-auto overscroll-contain outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
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
      </AppearancePreviewFrame>
      <div className="flex items-start gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={placementControlSurface}
          aria-expanded={catalogExpanded}
          aria-controls={catalogId}
          aria-label={catalogToggleLabel}
          title={catalogToggleLabel}
          onClick={onToggleCatalog}
        >
          <CatalogIcon aria-hidden="true" />
        </Button>
        <dl className="flex min-w-0 flex-1 flex-wrap gap-1.5">
          {materialPlacements.map((placement) => {
            const value = assignments[placement]
            const name = t(materialOptions[value].labelKey)
            const label = t(`settings.material.${placement}`)
            const valueId = `${id}-${placement}`
            return (
              <div
                key={placement}
                className={cn(
                  "relative isolate flex h-8 max-w-full min-w-0 items-center gap-1.5 overflow-hidden rounded-(--ui-radius-button) border px-2.5 text-xs",
                  placementControlSurface
                )}
                data-material-placement={placement}
                data-settings-material-control={
                  value === "none" ? "" : undefined
                }
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
                  <span className="relative">{label}</span>
                </dt>
                <dd className="relative flex min-w-0 items-center gap-1">
                  <button
                    type="button"
                    id={valueId}
                    className="min-w-0 cursor-pointer truncate rounded-sm text-left font-medium underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring"
                    title={name}
                    onClick={() => onEdit(placement)}
                  >
                    {name}
                  </button>
                  <Select
                    value={value}
                    onValueChange={(style) => {
                      if (style !== null) onAssign(placement, style)
                    }}
                  >
                    <SelectTrigger
                      size="sm"
                      aria-label={t("settings.material.selectPlacement", {
                        placement: label,
                      })}
                      aria-describedby={valueId}
                      className="-mr-1 size-6 shrink-0 cursor-pointer justify-center border-0 bg-transparent bg-none p-0 focus-visible:ring-2 focus-visible:ring-ring data-[size=sm]:h-6 [&_svg]:size-3"
                    />
                    <SelectContent
                      align="end"
                      alignItemWithTrigger={false}
                      className="w-max"
                    >
                      {materialStyles
                        .filter((style) =>
                          materialOptions[style].placements.includes(placement)
                        )
                        .map((style) => (
                          <SelectItem key={style} value={style}>
                            {t(materialOptions[style].labelKey)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </dd>
              </div>
            )
          })}
        </dl>
        <Button
          type="button"
          variant="outline"
          size="default"
          className={placementControlSurface}
          aria-label={t("settings.material.resetPreview")}
          onClick={onReset}
        >
          {t("settings.material.reset")}
        </Button>
      </div>
    </div>
  )
}
