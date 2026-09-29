import { useEffect, useRef } from "react"
import GhostCursor from "./ghost-cursor"
import type { GhostCursorHandle } from "./ghost-cursor"

function between(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function curve(start: number, control: number, end: number, progress: number) {
  const remaining = 1 - progress
  return (
    remaining * remaining * start +
    2 * remaining * progress * control +
    progress * progress * end
  )
}

export default function RandomGhostStorm({
  color,
  active = true,
}: {
  color: string
  active?: boolean
}) {
  const host = useRef<HTMLDivElement>(null)
  const ghost = useRef<GhostCursorHandle>(null)

  useEffect(() => {
    const element = host.current
    if (
      !element ||
      !active ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    let alive = true
    let frame = 0
    let timer = 0
    let lastPoint: { x: number; y: number } | null = null

    const leave = () => ghost.current?.leave()
    const schedule = (delay = between(80, 280)) => {
      timer = window.setTimeout(burst, delay)
    }
    const burst = () => {
      if (!alive) return
      const bounds = element.getBoundingClientRect()
      if (!bounds.width || !bounds.height) {
        schedule(500)
        return
      }
      const start = lastPoint ?? {
        x: between(0.25, 0.8),
        y: between(0.18, 0.82),
      }
      const end = {
        x: Math.min(0.95, Math.max(0.12, start.x + between(-0.25, 0.25))),
        y: Math.min(0.92, Math.max(0.08, start.y + between(-0.18, 0.18))),
      }
      const control = {
        x: between(Math.min(start.x, end.x), Math.max(start.x, end.x)),
        y: between(0.08, 0.92),
      }
      const duration = between(1600, 2800)
      const began = performance.now()
      const move = (time: number) => {
        if (!alive) return
        const progress = Math.min(1, (time - began) / duration)
        const eased = 1 - Math.pow(1 - progress, 3)
        const x = curve(start.x, control.x, end.x, eased)
        const y = curve(start.y, control.y, end.y, eased)
        ghost.current?.move(x, 1 - y)
        if (progress < 1) frame = requestAnimationFrame(move)
        else {
          lastPoint = end
          if (Math.random() < 0.22) {
            leave()
            lastPoint = null
            schedule(between(500, 1100))
          } else schedule()
        }
      }
      frame = requestAnimationFrame(move)
    }

    schedule(80)
    return () => {
      alive = false
      cancelAnimationFrame(frame)
      clearTimeout(timer)
      leave()
    }
  }, [active])

  if (!active) return null
  const dark = document.documentElement.classList.contains("dark")
  return (
    <div ref={host} className="pointer-events-none absolute inset-0">
      <GhostCursor
        ref={ghost}
        interactive={false}
        trailLength={50}
        inertia={0.92}
        grainIntensity={0.12}
        bloomStrength={0.3}
        bloomRadius={0.9}
        bloomThreshold={0.02}
        brightness={dark ? 1.35 : 0.95}
        color={color}
        mixBlendMode={dark ? "screen" : "multiply"}
        edgeIntensity={0.45}
        maxDevicePixelRatio={0.65}
        targetPixels={650_000}
        fadeDelayMs={260}
        fadeDurationMs={1700}
        zIndex={1}
      />
    </div>
  )
}
