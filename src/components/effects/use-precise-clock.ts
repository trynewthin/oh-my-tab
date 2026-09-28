import { useSyncExternalStore } from "react"

let snapshot = Date.now()
let interval: ReturnType<typeof setInterval> | undefined
let motion: MediaQueryList | undefined
const listeners = new Set<() => void>()
const getSnapshot = () => snapshot
const getServerSnapshot = () => 0
const noSubscribe = () => () => {}

function tick() {
  snapshot = Date.now()
  listeners.forEach((listener) => listener())
}

function synchronize() {
  clearInterval(interval)
  interval = undefined
  if (document.hidden || listeners.size === 0) return
  tick()
  interval = setInterval(tick, motion?.matches ? 1000 : 32)
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    motion.addEventListener("change", synchronize)
    document.addEventListener("visibilitychange", synchronize)
    synchronize()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size > 0) return
    clearInterval(interval)
    interval = undefined
    motion?.removeEventListener("change", synchronize)
    motion = undefined
    document.removeEventListener("visibilitychange", synchronize)
  }
}

/** Shared high-frequency display clock; inactive widgets use their coarse clock. */
export function usePreciseClock(active: boolean, wallTime: number) {
  const precise = useSyncExternalStore(
    active ? subscribe : noSubscribe,
    getSnapshot,
    getServerSnapshot
  )
  return active ? Math.max(wallTime, precise) : wallTime
}
