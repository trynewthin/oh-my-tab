import { useSyncExternalStore } from "react"

let snapshot = Date.now()
let timer: ReturnType<typeof setInterval> | undefined
const listeners = new Set<() => void>()
const previewTime = Date.UTC(2026, 0, 15, 10, 8)

const getSnapshot = () => snapshot
const getPreview = () => previewTime
const noSubscribe = () => () => {}

function tick() {
  snapshot = Date.now()
  listeners.forEach((listener) => listener())
}

function synchronize() {
  if (timer !== undefined) clearInterval(timer)
  timer = undefined
  if (document.hidden || listeners.size === 0) return
  tick()
  timer = setInterval(tick, 1000)
}

/** One visibility-aware wall clock shared by every time-based widget. */
function subscribe(listener: () => void) {
  listeners.add(listener)
  if (listeners.size === 1) {
    document.addEventListener("visibilitychange", synchronize)
    synchronize()
  }
  return () => {
    listeners.delete(listener)
    if (listeners.size !== 0) return
    if (timer !== undefined) clearInterval(timer)
    timer = undefined
    document.removeEventListener("visibilitychange", synchronize)
  }
}

export function useWallClock(preview = false) {
  return useSyncExternalStore(
    preview ? noSubscribe : subscribe,
    preview ? getPreview : getSnapshot,
    getPreview
  )
}
