import gsap from "gsap"

type FrameListener = (time: number | undefined) => void
type FrameSubscription = { paint: FrameListener; prepare?: () => void }
const listeners = new Set<FrameSubscription>()
let lastFrame = -Infinity
let motion: MediaQueryList | null = null

function tick(time: number) {
  if (document.hidden || motion?.matches || time - lastFrame < 1 / 30) return
  lastFrame = time
  paintFrame(time)
}
function paintFrame(time: number | undefined) {
  // Read every surface's bounds before any surface writes animated styles.
  listeners.forEach((listener) => listener.prepare?.())
  listeners.forEach((listener) => listener.paint(time))
}
function updateMotion() {
  paintFrame(motion?.matches ? undefined : gsap.ticker.time)
}

export function subscribeBurningFrame(
  paint: FrameListener,
  prepare?: () => void
) {
  if (!listeners.size) {
    motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    motion.addEventListener("change", updateMotion)
    lastFrame = -Infinity
    gsap.ticker.add(tick)
  }
  const listener = { paint, prepare }
  listeners.add(listener)
  prepare?.()
  paint(motion?.matches ? undefined : gsap.ticker.time)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      gsap.ticker.remove(tick)
      motion?.removeEventListener("change", updateMotion)
      motion = null
    }
  }
}
