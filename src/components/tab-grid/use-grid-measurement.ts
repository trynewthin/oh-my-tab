import { useLayoutEffect, useRef, useState, type MutableRefObject } from "react"

import type { Point } from "./drag/model"

// Pointer tracking feeds drag intent resolution, and -- only when the grid
// measures itself (no provided trackWidth) -- a ResizeObserver on the track
// keeps the measured width current.
export default function useGridMeasurement({
  gridRef,
  containerRef,
  contentBox = false,
  trackWidth,
}: {
  gridRef: MutableRefObject<HTMLDivElement | null>
  containerRef?: MutableRefObject<HTMLDivElement | null>
  contentBox?: boolean
  trackWidth?: number
}): {
  pointer: MutableRefObject<Point | null>
  measuredWidth: number
} {
  const pointer = useRef<Point | null>(null)
  const [measuredWidth, setMeasuredWidth] = useState(0)

  useLayoutEffect(() => {
    const trackPointer = (event: MouseEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    document.addEventListener("mousemove", trackPointer, { passive: true })
    const element = trackWidth
      ? null
      : (containerRef?.current ?? gridRef.current?.parentElement)
    const measure = () => {
      if (!element) return 0
      if (!contentBox) return element.getBoundingClientRect().width
      const style = getComputedStyle(element)
      return Math.max(
        0,
        element.clientWidth -
          Number.parseFloat(style.paddingLeft) -
          Number.parseFloat(style.paddingRight)
      )
    }
    const observer = element
      ? new ResizeObserver(() => {
          setMeasuredWidth(measure())
        })
      : null
    if (element && observer) {
      setMeasuredWidth(measure())
      observer.observe(element)
    }
    return () => {
      observer?.disconnect()
      document.removeEventListener("mousemove", trackPointer)
    }
  }, [containerRef, contentBox, gridRef, trackWidth])

  return { pointer, measuredWidth }
}
