import { isDotVisible } from "./dot-canvas-data"
import { dotDimensions, displayDots } from "./dot-canvas-data"
import { useLayoutEffect, useRef, useState, type PointerEvent } from "react"

export default function DotArt({
  pixels,
  onPointerDown,
  onPointerMove,
  onPointerUp,
}: {
  pixels: string[]
  onPointerDown?: (event: PointerEvent<SVGSVGElement>) => void
  onPointerMove?: (event: PointerEvent<SVGSVGElement>) => void
  onPointerUp?: (event: PointerEvent<SVGSVGElement>) => void
}) {
  const dots = displayDots(pixels)
  const { columns, rows } = dotDimensions(dots)
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ width: 240, height: 160 })
  useLayoutEffect(() => {
    const element = ref.current
    if (!element) return
    const update = () => {
      const { width, height } = element.getBoundingClientRect()
      if (width && height) setSize({ width, height })
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const pitchX = size.width / columns
  const pitchY = size.height / rows
  const dotSize = Math.min(pitchX, pitchY) * 0.8
  return (
    <svg
      ref={ref}
      viewBox={`0 0 ${size.width} ${size.height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="点阵画布"
      className="h-full w-full overflow-hidden rounded-2xl"
      style={{ touchAction: onPointerDown ? "none" : undefined }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {dots.map((color, index) => (
        <rect
          key={index}
          x={(index % columns) * pitchX + (pitchX - dotSize) / 2}
          y={Math.floor(index / columns) * pitchY + (pitchY - dotSize) / 2}
          width={dotSize}
          height={dotSize}
          rx={dotSize * 0.18}
          fill={color || "currentColor"}
          opacity={isDotVisible(index, columns, rows) ? (color ? 1 : 0.07) : 0}
        />
      ))}
    </svg>
  )
}
