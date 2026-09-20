import { useLayoutEffect, useRef, useState, type MutableRefObject } from "react"

import type { Point } from "./drag/model"

// Pointer tracking feeds drag intent resolution, and -- only when the grid
// measures itself (no provided trackWidth) -- a ResizeObserver on the track
// keeps the measured width current.
export default function useGridMeasurement({
  gridRef,
  trackWidth,
}: {
  gridRef: MutableRefObject<HTMLDivElement | null>
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
    const element = trackWidth ? null : gridRef.current?.parentElement
    const observer = element
      ? new ResizeObserver(() => {
          setMeasuredWidth(element.getBoundingClientRect().width)
        })
      : null
    if (element && observer) observer.observe(element)
    return () => {
      observer?.disconnect()
      document.removeEventListener("mousemove", trackPointer)
    }
  }, [gridRef, trackWidth])

  return { pointer, measuredWidth }
}
