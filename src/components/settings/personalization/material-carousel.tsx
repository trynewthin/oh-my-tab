import { CaretLeft, CaretRight, Check } from "@phosphor-icons/react"
import useEmblaCarousel from "embla-carousel-react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import LiquidGlassSurface from "@/components/effects/liquid-glass-surface"
import MaterialSurface, {
  type FairIsleAppearance,
  type MaterialStyle,
} from "@/components/effects/material-surface"
import { Button } from "@/components/ui/button"
import type { LiquidGlassSettings } from "@/lib/liquid-glass"
import {
  materialOptions,
  materialStyles,
} from "@/components/settings/personalization/material-preview-options"
import "./material-carousel.css"

export default function MaterialCarousel({
  color,
  fairIsle,
  liquidGlass,
  value,
  onChange,
  configurationId,
}: {
  color: string
  fairIsle: FairIsleAppearance
  liquidGlass: LiquidGlassSettings
  value: MaterialStyle
  onChange: (value: MaterialStyle) => void
  configurationId: string
}) {
  const { t } = useTranslation()
  const [startIndex] = useState(() => materialStyles.indexOf(value))
  const [viewportRef, carousel] = useEmblaCarousel({
    align: "start",
    loop: true,
    startIndex,
    breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } },
  })

  return (
    <div
      role="group"
      aria-label={t("settings.material.catalog")}
      className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
    >
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={t("settings.material.previous")}
        onClick={() => carousel?.scrollPrev()}
      >
        <CaretLeft />
      </Button>
      <div
        ref={viewportRef}
        data-material-carousel-viewport
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_0.875rem,black_calc(100%_-_0.875rem),transparent)]"
      >
        <div className="-ml-2 flex touch-pan-y select-none">
          {materialStyles.map((style) => (
            <div
              key={style}
              className="min-w-0 flex-[0_0_48%] pl-2 sm:flex-[0_0_max(7.5rem,22%)]"
            >
              <Button
                type="button"
                variant="outline"
                aria-pressed={style === value}
                aria-controls={configurationId}
                className="relative isolate flex h-16 w-full cursor-pointer items-end justify-start overflow-hidden border-ui-border-panel bg-muted p-0 text-left focus-visible:ring-inset aria-pressed:border-primary aria-pressed:ring-1 aria-pressed:ring-primary aria-pressed:ring-inset sm:h-20 dark:bg-muted"
                onClick={() => onChange(style)}
              >
                {style !== "none" && (
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 overflow-hidden [clip-path:inset(0_round_max(0px,calc(var(--ui-radius-button)_-_1px)))]"
                  >
                    {style === "liquid-glass" ? (
                      <>
                        <div className="material-carousel-glass-backdrop absolute inset-0" />
                        <div className="absolute inset-x-[16%] top-1.5 bottom-[1.875rem] rounded-(--ui-radius-control) sm:top-2 sm:bottom-9">
                          <LiquidGlassSurface settings={liquidGlass} />
                        </div>
                      </>
                    ) : (
                      <MaterialSurface
                        color={color}
                        textureId={`settings-material-thumbnail-${style}`}
                        effectStyle={style}
                        coverage={100}
                        staticFrame={style === "star-trails"}
                        fairIsle={fairIsle}
                        transparent
                      />
                    )}
                  </div>
                )}
                <span className="relative flex h-6 w-full items-center justify-between gap-1.5 bg-background/78 px-3 text-xs font-medium text-foreground backdrop-blur-md sm:h-7">
                  <span className="truncate">
                    {t(materialOptions[style].labelKey)}
                  </span>
                  {style === value && (
                    <Check
                      aria-hidden="true"
                      weight="bold"
                      className="size-3"
                    />
                  )}
                </span>
              </Button>
            </div>
          ))}
        </div>
      </div>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        aria-label={t("settings.material.next")}
        onClick={() => carousel?.scrollNext()}
      >
        <CaretRight />
      </Button>
    </div>
  )
}
