type FrameListener = (time: number | undefined) => void
type FrameSubscription = {
  paint: FrameListener
  prepare?: () => void
  smooth: boolean
  home: boolean
  lastPaint: number
}
const listeners = new Set<FrameSubscription>()
let homePaused = false
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
let animationFrame: number | undefined

function cancelFrame() {
  clearTimeout(timer)
  timer = undefined
  if (animationFrame !== undefined) cancelAnimationFrame(animationFrame)
  animationFrame = undefined
}
function canAnimate(listener: FrameSubscription) {
  return !homePaused || !listener.home
}
function scheduleFrame() {
  if (document.hidden || motion?.matches) return
  let mode: "smooth" | "regular" | "idle" = "idle"
  for (const listener of listeners) {
    if (!canAnimate(listener)) continue
    if (listener.smooth) {
      mode = "smooth"
      break
    }
    mode = "regular"
  }
  if (
    (mode === "smooth" && animationFrame !== undefined) ||
    (mode === "regular" && timer !== undefined)
  )
    return
  cancelFrame()
  if (mode === "smooth") animationFrame = requestAnimationFrame(tick)
  if (mode === "regular") timer = setTimeout(tick, frameDelay())
}
function paintFrame(time: number | undefined) {
  const now = performance.now()
  const interval = frameDelay()
  const active = [...listeners].filter(
    (listener) =>
      canAnimate(listener) &&
      (time === undefined ||
        listener.smooth ||
        now - listener.lastPaint >= interval - 0.5)
  )
  active.forEach((listener) => listener.prepare?.())
  active.forEach((listener) => {
    if (!listeners.has(listener)) return
    listener.lastPaint = now
    listener.paint(time)
  })
}
function tick() {
  timer = undefined
  animationFrame = undefined
  if (!listeners.size || document.hidden || motion?.matches) return
  paintFrame(performance.now() / 1000)
  scheduleFrame()
}
function updateMotion() {
  cancelFrame()
  if (document.hidden) return
  if (motion?.matches) paintFrame(undefined)
  else tick()
}

export function setHomeBurningFramesPaused(paused: boolean) {
  if (paused === homePaused) return
  homePaused = paused
  if (!listeners.size) return
  if (!paused && motion?.matches && !document.hidden) paintFrame(undefined)
  scheduleFrame()
}

export function subscribeBurningFrame(
  paint: FrameListener,
  prepare?: () => void,
  options: { smooth?: boolean; element?: Element } = {}
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
  const listener: FrameSubscription = {
    paint,
    prepare,
    smooth: options.smooth ?? false,
    home: Boolean(options.element?.closest("[data-home-ui]")),
    lastPaint: performance.now(),
  }
  listeners.add(listener)
  prepare?.()
  paint(
    motion?.matches || !canAnimate(listener)
      ? undefined
      : performance.now() / 1000
  )
  scheduleFrame()
  return () => {
    if (!listeners.delete(listener)) return
    if (!listeners.size) {
      activityEvents.forEach((event) =>
        window.removeEventListener(event, recordActivity)
      )
      cancelFrame()
      motion?.removeEventListener("change", updateMotion)
      document.removeEventListener("visibilitychange", updateMotion)
      motion = null
    } else scheduleFrame()
  }
}
