import { useLayoutEffect, useRef } from "react"
import gsap from "gsap"

export function useLayoutFlip(signature: string) {
  const ref = useRef<HTMLDivElement | null>(null)
  const previous = useRef(new Map<string, { x: number; y: number }>())

  useLayoutEffect(() => {
    const root = ref.current
    if (!root) return
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    const next = new Map<string, { x: number; y: number }>()
    for (const node of root.querySelectorAll<HTMLElement>("[data-flip-id]")) {
      const id = node.dataset.flipId
      if (!id) continue
      const x = node.offsetLeft
      const y = node.offsetTop
      next.set(id, { x, y })
      const last = previous.current.get(id)
      if (!last || reduced) {
        gsap.set(node, { x: 0, y: 0 })
        continue
      }
      if (last.x === x && last.y === y) continue
      gsap.fromTo(
        node,
        {
          x: last.x - x + Number(gsap.getProperty(node, "x")),
          y: last.y - y + Number(gsap.getProperty(node, "y")),
        },
        { x: 0, y: 0, duration: 0.24, ease: "power2.out", overwrite: true }
      )
    }
    previous.current = next
  }, [signature])

  useLayoutEffect(
    () => () => {
      const root = ref.current
      if (!root) return
      for (const node of root.querySelectorAll<HTMLElement>("[data-flip-id]")) {
        gsap.killTweensOf(node)
      }
    },
    []
  )

  return ref
}
