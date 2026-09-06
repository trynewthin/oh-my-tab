let pointer: { x: number; y: number } | null = null
let users = 0
const move = (event: PointerEvent) => {
  pointer = { x: event.clientX, y: event.clientY }
}
const clear = () => {
  pointer = null
}
export function trackEffectPointer() {
  if (users++ === 0) {
    document.addEventListener("pointermove", move, { passive: true })
    document.addEventListener("pointerleave", clear)
    window.addEventListener("blur", clear)
  }
  return () => {
    if (--users === 0) {
      document.removeEventListener("pointermove", move)
      document.removeEventListener("pointerleave", clear)
      window.removeEventListener("blur", clear)
      clear()
    }
  }
}
export const effectPointer = () => pointer
