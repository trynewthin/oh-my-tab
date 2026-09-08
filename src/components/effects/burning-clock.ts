type FrameListener = (time: number | undefined) => void
type FrameSubscription = { paint: FrameListener; prepare?: () => void }
const listeners = new Set<FrameSubscription>()
let motion: MediaQueryList | null = null
let lastActivity = 0
const activityEvents = [
  "pointermove",
  "pointerdown",
  "keydown",
  "wheel",
] as const
function recordActivity() {
  lastActivity = performance.now()
}
function frameDelay() {
  return performance.now() - lastActivity < 1500 ? 1000 / 30 : 1000 / 8
}
let timer: ReturnType<typeof setTimeout> | undefined

function paintFrame(time: number | undefined) {
  listeners.forEach((listener) => listener.prepare?.())
  listeners.forEach((listener) => listener.paint(time))
}
function tick() {
  timer = undefined
  if (!listeners.size || document.hidden || motion?.matches) return
  paintFrame(performance.now() / 1000)
  timer = setTimeout(tick, frameDelay())
}
function updateMotion() {
  clearTimeout(timer)
  timer = undefined
  if (document.hidden) return
  if (motion?.matches) paintFrame(undefined)
  else tick()
}

export function subscribeBurningFrame(
  paint: FrameListener,
  prepare?: () => void
) {
  if (!listeners.size) {
    recordActivity()
    activityEvents.forEach((event) =>
      window.addEventListener(event, recordActivity, { passive: true })
    )
    motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    motion.addEventListener("change", updateMotion)
    document.addEventListener("visibilitychange", updateMotion)
  }
  const listener = { paint, prepare }
  listeners.add(listener)
  prepare?.()
  paint(motion?.matches ? undefined : performance.now() / 1000)
  if (!timer && !document.hidden && !motion?.matches)
    timer = setTimeout(tick, frameDelay())
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, recordActivity)
      )
      clearTimeout(timer)
      timer = undefined
      motion?.removeEventListener("change", updateMotion)
      document.removeEventListener("visibilitychange", updateMotion)
      motion = null
    }
  }
}
