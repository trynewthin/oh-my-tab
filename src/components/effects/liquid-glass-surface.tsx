import { useEffect, useRef, type CSSProperties, type RefObject } from "react"
import { liquidGlassOptics, type LiquidGlassSettings } from "@/lib/liquid-glass"
import { LiquidGlassRefraction } from "./liquid-glass-refraction"
import { useGlassDisplacement } from "./use-glass-displacement"
import "./liquid-glass.css"

export default function LiquidGlassSurface({
  settings,
  sample,
  pointerTarget,
}: {
  settings: LiquidGlassSettings
  sample?: boolean
  pointerTarget?: RefObject<HTMLElement | null>
}) {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const glintRef = useRef<HTMLSpanElement>(null)
  const optics = liquidGlassOptics(settings)
  const tracksPointer =
    optics.pointerHighlight && settings.glintIntensity > 0 && !sample
  const { id: filterId, image: displacement } = useGlassDisplacement(
    surfaceRef,
    !sample && optics.refraction > 0,
    settings.rimWidth
  )

  useEffect(() => {
    const target = pointerTarget?.current
    const surface = surfaceRef.current
    const glint = glintRef.current
    if (!tracksPointer || !target || !surface || !glint) return

    const finePointer = matchMedia("(hover: hover) and (pointer: fine)")
    const reducedEffects = matchMedia(
      "(prefers-reduced-motion: reduce), (prefers-reduced-transparency: reduce), (forced-colors: active)"
    )
    let frame = 0
    let timer = 0
    let lastPaint = -Infinity
    let x = 0
    let y = 0

    const stop = () => {
      cancelAnimationFrame(frame)
      window.clearTimeout(timer)
      frame = 0
      timer = 0
      glint.style.opacity = ""
    }

    const schedulePaint = () => {
      timer = 0
      frame = requestAnimationFrame((now) => {
        frame = 0
        lastPaint = now
        const bounds = surface.getBoundingClientRect()
        const inside =
          x >= bounds.left &&
          x <= bounds.right &&
          y >= bounds.top &&
          y <= bounds.bottom
        glint.style.opacity = inside ? "1" : ""
        if (inside)
          glint.style.transform = `translate3d(${x - bounds.left}px, ${y - bounds.top}px, 0)`
      })
    }

    const move = (event: PointerEvent) => {
      if (
        !finePointer.matches ||
        reducedEffects.matches ||
        event.pointerType === "touch"
      )
        return
      x = event.clientX
      y = event.clientY
      if (frame || timer) return
      const delay = 32 - (performance.now() - lastPaint)
      if (delay > 0) timer = window.setTimeout(schedulePaint, delay)
      else schedulePaint()
    }

    target.addEventListener("pointermove", move, { passive: true })
    target.addEventListener("pointerleave", stop)
    target.addEventListener("pointercancel", stop)
    finePointer.addEventListener("change", stop)
    reducedEffects.addEventListener("change", stop)
    return () => {
      target.removeEventListener("pointermove", move)
      target.removeEventListener("pointerleave", stop)
      target.removeEventListener("pointercancel", stop)
      finePointer.removeEventListener("change", stop)
      reducedEffects.removeEventListener("change", stop)
      stop()
    }
  }, [pointerTarget, tracksPointer])

  const surface = (
    <div
      ref={surfaceRef}
      aria-hidden="true"
      data-effect-style="liquid-glass"
      data-sample={sample || undefined}
      data-sheen={settings.sheen && optics.sheenIntensity > 0}
      className="liquid-glass pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit]"
      style={
        {
          "--glass-tint": optics.tint,
          "--glass-alpha": `${optics.opacity * 100}%`,
          "--glass-blur": `${optics.blur}px`,
          "--glass-saturation": `${settings.saturation}%`,
          "--glass-sheen": optics.sheenIntensity / 100,
          "--glass-glint-alpha": settings.glintIntensity / 100,
          "--glass-glint-size": `${settings.glintSize}px`,
          "--glass-refraction": displacement
            ? `url("#${filterId}")`
            : undefined,
        } as CSSProperties
      }
    >
      {tracksPointer && pointerTarget && (
        <span ref={glintRef} className="liquid-glass-glint" />
      )}
    </div>
  )

  return (
    <>
      {displacement && (
        <LiquidGlassRefraction
          id={filterId}
          image={displacement}
          blur={optics.blur}
          strength={optics.refraction}
        />
      )}
      {surface}
    </>
  )
}
