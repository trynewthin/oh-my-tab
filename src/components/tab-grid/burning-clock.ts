import gsap from "gsap"

type FrameListener = (time: number | undefined) => void
const listeners = new Set<FrameListener>()
let lastFrame = -Infinity
let motion: MediaQueryList | null = null

function tick(time: number) {
  if (document.hidden || motion?.matches || time - lastFrame < 1 / 30) return
  lastFrame = time
  listeners.forEach((listener) => listener(time))
}
function updateMotion() {
  listeners.forEach((listener) =>
    listener(motion?.matches ? undefined : gsap.ticker.time)
  )
}

export function subscribeBurningFrame(listener: FrameListener) {
  if (!listeners.size) {
    motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    motion.addEventListener("change", updateMotion)
    lastFrame = -Infinity
    gsap.ticker.add(tick)
  }
  listeners.add(listener)
  listener(motion?.matches ? undefined : gsap.ticker.time)
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      gsap.ticker.remove(tick)
      motion?.removeEventListener("change", updateMotion)
      motion = null
    }
  }
}
