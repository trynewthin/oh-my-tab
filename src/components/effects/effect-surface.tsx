import { particleCell } from "./particle-texture"
import { trackEffectPointer, effectPointer } from "./pointer-tracker"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useVisualTransition } from "./use-visual-transition"
import { useEffect, useRef, useState } from "react"
import { textureSeed, burningCell } from "./burning-texture"
import { subscribeBurningFrame } from "./burning-clock"

const CELL_SIZE = 8
const GAP = 1

export default function EffectSurface({
  color,
  textureId,
  offsetY = 0,
  coverage = 65,
  animated = false,
  visible = true,
  entrance = false,
}: {
  color: string
  textureId: string
  offsetY?: number
  coverage?: number
  animated?: boolean
  visible?: boolean
  entrance?: boolean
}) {
  const effectStyle = useHomeSettingsStore((state) => state.effectStyle)
  const amplitude = useHomeSettingsStore((state) => state.burningAmplitude)
  const {
    progress: reveal,
    initial: initialVisibility,
    phase,
  } = useVisualTransition(visible, { appear: entrance })
  const entering = phase === "entering"
  const transitioning = entering || phase === "exiting"
  const region = useRef<HTMLDivElement>(null)
  const [grid, setGrid] = useState({ columns: 0, rows: 0 })
  const seed = textureSeed(textureId)
  const firstRow = Math.floor(offsetY / (CELL_SIZE + GAP))
  const shiftY = offsetY % (CELL_SIZE + GAP)

  useEffect(() => {
    const element = region.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const columns = Math.ceil(entry.contentRect.width / (CELL_SIZE + GAP))
      const rows = Math.ceil(entry.contentRect.height / (CELL_SIZE + GAP))
      setGrid((current) =>
        current.columns === columns && current.rows === rows
          ? current
          : { columns, rows }
      )
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (
      ((!animated || amplitude === 0 || phase === "hidden") &&
        !transitioning) ||
      !grid.columns ||
      !region.current
    )
      return
    const cells = Array.from(
      region.current.querySelectorAll<HTMLElement>("[data-burn-cell]")
    )
    const releasePointer =
      effectStyle === "particles" ? trackEffectPointer() : () => {}
    const paint = (time?: number) => {
      const position = effectPointer()
      const bounds =
        effectStyle === "particles" && position
          ? region.current?.getBoundingClientRect()
          : null
      const pointer =
        position && bounds
          ? {
              x: position.x - bounds.left,
              y: position.y - bounds.top + offsetY,
            }
          : null
      cells.forEach((cell, index) => {
        const x = index % grid.columns
        const y = firstRow + Math.floor(index / grid.columns)
        if (effectStyle === "particles") {
          const appearance = particleCell(
            color,
            seed,
            x,
            y,
            grid.columns,
            time,
            reveal.current.value,
            amplitude,
            pointer
          )
          cell.style.backgroundColor = appearance.backgroundColor
          cell.style.transform = appearance.transform
        } else {
          cell.style.backgroundColor = burningCell(
            color,
            seed,
            x,
            y,
            grid.columns,
            time,
            reveal.current.value,
            amplitude
          )
          cell.style.transform = "none"
        }
      })
    }
    const unsubscribe = subscribeBurningFrame(paint)
    return () => {
      unsubscribe()
      releasePointer()
      paint()
    }
  }, [
    effectStyle,
    offsetY,
    animated,
    transitioning,
    phase,
    amplitude,
    visible,
    grid.columns,
    grid.rows,
    color,
    seed,
    firstRow,
    shiftY,
    reveal,
  ])

  return (
    <div
      aria-hidden="true"
      data-burning-entrance={entering ? "running" : undefined}
      data-effect-phase={phase}
      data-effect-style={effectStyle}
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] bg-card"
    >
      <div
        ref={region}
        className="absolute inset-y-0 right-0 overflow-hidden"
        style={{ width: `${coverage}%` }}
      >
        <div
          className="absolute top-0 right-0 grid"
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, grid.columns)}, ${CELL_SIZE}px)`,
            gridAutoRows: `${CELL_SIZE}px`,
            gap: GAP,
            top: -shiftY,
          }}
        >
          {Array.from(
            { length: grid.columns * (grid.rows + (shiftY ? 1 : 0)) },
            (_, index) => {
              const x = index % grid.columns
              const y = firstRow + Math.floor(index / grid.columns)
              return (
                <span
                  key={index}
                  data-burn-cell
                  style={{
                    ...(effectStyle === "particles"
                      ? particleCell(
                          color,
                          seed,
                          x,
                          y,
                          grid.columns,
                          undefined,
                          initialVisibility,
                          amplitude,
                          null
                        )
                      : {
                          backgroundColor: burningCell(
                            color,
                            seed,
                            x,
                            y,
                            grid.columns,
                            undefined,
                            initialVisibility
                          ),
                          transform: "none",
                        }),
                  }}
                />
              )
            }
          )}
        </div>
      </div>
    </div>
  )
}
