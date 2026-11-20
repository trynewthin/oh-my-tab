import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import useEmblaCarousel from "embla-carousel-react"
import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from "react"
import { useTranslation } from "react-i18next"
import LiquidGlassSurface from "@/components/effects/liquid-glass-surface"
import MaterialSurface, {
  type FairIsleAppearance,
  type MaterialStyle,
} from "@/components/effects/material-surface"
import { Button } from "@/components/ui/button"
import type { LiquidGlassSettings } from "@/lib/liquid-glass"
import { materialOptions, materialStyles } from "@/lib/material"
import "./material-carousel.css"

const arrowClassName =
  "absolute top-1/2 z-10 grid size-8 -translate-y-1/2 cursor-pointer place-items-center rounded-(--ui-radius-button) bg-transparent text-foreground transition-colors hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring"
const wheelStepInterval = 120

export type MaterialCarouselHandle = {
  scrollToStyle: (style: MaterialStyle) => void
}

export default function MaterialCarousel({
  ref,
  color,
  fairIsle,
  liquidGlass,
  value,
  onChange,
  configurationId,
}: {
  ref?: Ref<MaterialCarouselHandle>
  color: string
  fairIsle: FairIsleAppearance
  liquidGlass: LiquidGlassSettings
  value: MaterialStyle
  onChange: (value: MaterialStyle) => void
  configurationId: string
}) {
  const { t } = useTranslation()
  const catalogRef = useRef<HTMLDivElement>(null)
  const [startIndex] = useState(() => materialStyles.indexOf(value))
  const [viewportRef, carousel] = useEmblaCarousel({
    align: "start",
    loop: true,
    startIndex,
    breakpoints: { "(prefers-reduced-motion: reduce)": { duration: 0 } },
  })

  useImperativeHandle(
    ref,
    () => ({
      scrollToStyle: (style) =>
        carousel?.scrollTo(materialStyles.indexOf(style)),
    }),
    [carousel]
  )

  useEffect(() => {
    const catalog = catalogRef.current
    if (!catalog || !carousel) return
    let lastStepAt = -Infinity

    const handleWheel = (event: WheelEvent) => {
      if (
        !event.cancelable ||
        event.defaultPrevented ||
        event.ctrlKey ||
        event.metaKey
      )
        return
      const { deltaX, deltaY } = event
      const delta = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY
      if (!delta) return
      const forward = delta > 0
      if (forward ? !carousel.canScrollNext() : !carousel.canScrollPrev())
        return

      event.preventDefault()
      // Trackpad bursts should not advance one slide per wheel event.
      if (event.timeStamp - lastStepAt < wheelStepInterval) return
      lastStepAt = event.timeStamp
      if (forward) carousel.scrollNext()
      else carousel.scrollPrev()
    }

    catalog.addEventListener("wheel", handleWheel, { passive: false })
    return () => catalog.removeEventListener("wheel", handleWheel)
  }, [carousel])

  return (
    <div
      ref={catalogRef}
      role="group"
      aria-label={t("settings.material.catalog")}
      className="relative isolate w-full"
    >
      <button
        type="button"
        className={`${arrowClassName} left-0`}
        aria-label={t("settings.material.previous")}
        onClick={() => carousel?.scrollPrev()}
      >
        <CaretLeft aria-hidden="true" weight="bold" className="size-4" />
      </button>
      <div
        ref={viewportRef}
        data-material-carousel-viewport
        className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_2rem,black_calc(100%_-_2rem),transparent)]"
      >
        <div className="-ml-2 flex touch-pan-y select-none">
          {materialStyles.map((style) => (
            <div
              key={style}
              className="min-w-0 flex-[0_0_44%] pl-2 sm:flex-[0_0_max(7.5rem,21%)]"
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
                <span className="relative flex h-6 w-full items-center bg-background/78 px-3 text-xs font-medium text-foreground backdrop-blur-md sm:h-7">
                  <span className="truncate">
                    {t(materialOptions[style].labelKey)}
                  </span>
                </span>
              </Button>
            </div>
          ))}
        </div>
      </div>
      <button
        type="button"
        className={`${arrowClassName} right-0`}
        aria-label={t("settings.material.next")}
        onClick={() => carousel?.scrollNext()}
      >
        <CaretRight aria-hidden="true" weight="bold" className="size-4" />
      </button>
    </div>
  )
}
