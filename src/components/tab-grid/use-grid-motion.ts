import { useCallback, useLayoutEffect, useRef } from "react"
import gsap from "gsap"
import type { GridPlacement } from "./grid-layout"

export function useGridMotion(
  placement: GridPlacement,
  dragging: boolean,
  setNodeRef: (node: HTMLElement | null) => void
) {
  const node = useRef<HTMLElement | null>(null)
  const previous = useRef<{ x: number; y: number; dragging: boolean } | null>(
    null
  )
  const ref = useCallback(
    (element: HTMLElement | null) => {
      node.current = element
      setNodeRef(element)
    },
    [setNodeRef]
  )

  useLayoutEffect(() => {
    const element = node.current
    if (!element) return
    const x = element.offsetLeft
    const y = element.offsetTop
    const last = previous.current
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches
    if (
      last &&
      !dragging &&
      !last.dragging &&
      !reducedMotion &&
      (last.x !== x || last.y !== y)
    ) {
      const startX = last.x - x + Number(gsap.getProperty(element, "x"))
      const startY = last.y - y + Number(gsap.getProperty(element, "y"))
      gsap.fromTo(
        element,
        { x: startX, y: startY },
        { x: 0, y: 0, duration: 0.24, ease: "power3.out", overwrite: true }
      )
    } else if (dragging || last?.dragging || reducedMotion) {
      gsap.killTweensOf(element)
      gsap.set(element, { x: 0, y: 0 })
    }
    previous.current = { x, y, dragging }
  }, [placement.x, placement.y, placement.height, dragging])

  useLayoutEffect(
    () => () => {
      if (node.current) gsap.killTweensOf(node.current)
    },
    []
  )
  return ref
}
