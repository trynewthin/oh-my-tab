import { useLayoutEffect, useRef } from "react"

export function ItemGlow({
  color,
  opacity = 0.22,
}: {
  color: string
  opacity?: number
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{
        background: color,
        opacity,
        filter: "blur(12px)",
      }}
    />
  )
}

export type GridGlowTarget = {
  x: number
  y: number
  width: number
  height: number
  color: string
}

export function GridDropGlow({ target }: { target?: GridGlowTarget }) {
  const x = target?.x
  const y = target?.y
  const width = target?.width
  const height = target?.height
  const color = target?.color
  const element = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (
      x === undefined ||
      y === undefined ||
      width === undefined ||
      height === undefined ||
      color === undefined
    )
      return
    const node = element.current
    if (!node) return
    node.style.width = `${width}px`
    node.style.height = `${height}px`
    node.style.transform = `translate3d(${x}px, ${y}px, 0)`
    node.style.setProperty("--grid-drop-color", color)
  }, [x, y, width, height, color])
  return (
    <div
      ref={element}
      aria-hidden="true"
      className="pointer-events-none absolute top-0 left-0 transition-transform duration-150 ease-out motion-reduce:transition-none"
    >
      <div
        data-grid-drop-glow
        className="absolute inset-0 transition-opacity duration-200 ease-out will-change-[opacity] motion-reduce:transition-none"
        style={{ opacity: target ? 1 : 0 }}
      >
        <ItemGlow color="var(--grid-drop-color)" />
      </div>
    </div>
  )
}
