import { useEffect, useEffectEvent, useLayoutEffect, useRef } from "react"
import { DEFAULT_STAR_TRAIL_SPEED } from "@/lib/star-trails"
import { textureSeed } from "./burning-texture"
import { subscribeBurningFrame } from "./burning-clock"
import { createStarTrailsCanvas } from "./star-trails-canvas"
import { useVisualTransition } from "./use-visual-transition"

export default function StarTrailsSurface({
  color,
  textureId,
  coverage = 90,
  speed = DEFAULT_STAR_TRAIL_SPEED,
  animated = false,
  staticFrame = false,
  visible = true,
  entrance = false,
  transparent = false,
}: {
  color: string
  textureId: string
  coverage?: number
  speed?: number
  animated?: boolean
  staticFrame?: boolean
  visible?: boolean
  entrance?: boolean
  transparent?: boolean
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const colorProbe = useRef<HTMLSpanElement>(null)
  const renderer = useRef<ReturnType<typeof createStarTrailsCanvas>>(null)
  const seed = textureSeed(textureId)
  const { progress, phase } = useVisualTransition(visible, { appear: entrance })
  const transitioning = phase === "entering" || phase === "exiting"
  const holdTrails = staticFrame && speed > 0
  const paint = useEffectEvent((time?: number) => {
    if (holdTrails) renderer.current?.paintStatic(progress.current.value)
    else
      renderer.current?.paint(
        time,
        progress.current.value,
        animated ? speed : 0
      )
  })
  const refresh = useEffectEvent(() => {
    const element = canvas.current
    const probe = colorProbe.current
    if (!element || !probe) return
    renderer.current?.update({
      width: element.clientWidth,
      height: element.clientHeight,
      color,
      starColor: getComputedStyle(probe).color,
      coverage,
    })
    if (holdTrails) renderer.current?.paintStatic(progress.current.value)
    else renderer.current?.repaint(progress.current.value)
  })

  useLayoutEffect(() => {
    const element = canvas.current
    if (!element) return
    const effect = createStarTrailsCanvas(element, seed)
    renderer.current = effect
    refresh()
    const resize = new ResizeObserver(() => refresh())
    resize.observe(element)
    const theme = new MutationObserver(() => refresh())
    theme.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "style"],
    })
    return () => {
      resize.disconnect()
      theme.disconnect()
      effect?.dispose()
      if (renderer.current === effect) renderer.current = null
    }
  }, [seed])

  useEffect(() => {
    refresh()
  }, [color, coverage, holdTrails])

  useEffect(() => {
    const element = canvas.current
    const effect = renderer.current
    if (!element || !effect) return
    if (phase === "hidden") {
      effect.pause()
      paint()
      return
    }
    let unsubscribe: (() => void) | undefined
    const stationary = staticFrame || !animated || speed === 0
    const settled = () => holdTrails || !effect.hasTrails()
    const pause = () => {
      unsubscribe?.()
      unsubscribe = undefined
      effect.pause()
    }
    const onFrame = (time?: number) => {
      paint(time)
      if (stationary && !transitioning && settled()) pause()
    }
    const resume = () => {
      if (stationary && !transitioning && settled()) {
        effect.pause()
        paint()
        return
      }
      unsubscribe ??= subscribeBurningFrame(onFrame, undefined, {
        smooth: true,
      })
      if (stationary && !transitioning && settled()) pause()
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) resume()
        else pause()
      },
      { rootMargin: "100px" }
    )
    const onVisibilityChange = () => {
      if (document.hidden) effect.pause()
    }
    document.addEventListener("visibilitychange", onVisibilityChange)
    observer.observe(element)
    resume()
    return () => {
      observer.disconnect()
      document.removeEventListener("visibilitychange", onVisibilityChange)
      pause()
    }
  }, [animated, speed, phase, transitioning, seed, staticFrame, holdTrails])

  return (
    <div
      aria-hidden="true"
      data-effect-style="star-trails"
      data-effect-phase={phase}
      data-star-trail-speed={speed}
      data-star-trail-mode={staticFrame ? "static" : "dynamic"}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] [contain:layout_paint_style] ${transparent ? "" : "bg-card"}`}
    >
      <span
        ref={colorProbe}
        className="hidden"
        style={{ color: `color-mix(in srgb, ${color} 38%, var(--foreground))` }}
      />
      <canvas ref={canvas} className="absolute inset-0 h-full w-full" />
    </div>
  )
}
