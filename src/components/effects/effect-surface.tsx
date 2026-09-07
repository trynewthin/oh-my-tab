import { createParticleCell, particleCell } from "./particle-texture"
import { trackEffectPointer, effectPointer } from "./pointer-tracker"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useVisualTransition } from "./use-visual-transition"
import { useEffect, useRef, useState } from "react"
import {
  textureSeed,
  burningCell,
  createBurningTexture,
} from "./burning-texture"
import { subscribeBurningFrame } from "./burning-clock"
import { createBurningCanvas } from "./burning-canvas"

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
  const [grid, setGrid] = useState({ columns: 0, rows: 0, width: 0, height: 0 })
  const seed = textureSeed(textureId)
  const firstRow = Math.floor(offsetY / (CELL_SIZE + GAP))
  const shiftY = offsetY % (CELL_SIZE + GAP)

  useEffect(() => {
    const element = region.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const columns = Math.ceil(entry.contentRect.width / (CELL_SIZE + GAP))
      const rows = Math.ceil(entry.contentRect.height / (CELL_SIZE + GAP))
      setGrid((current) =>
        current.columns === columns &&
        current.rows === rows &&
        current.width === width &&
        current.height === height
          ? current
          : { columns, rows, width, height }
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
    const element = region.current
    const cells = Array.from(
      element.querySelectorAll<HTMLElement>("[data-burn-cell]"),
      (cell, index) => {
        const x = index % grid.columns
        const y = firstRow + Math.floor(index / grid.columns)
        return {
          cell,
          x,
          y,
          particle:
            effectStyle === "particles"
              ? createParticleCell(color, seed, x, y, grid.columns)
              : null,
          backgroundColor: "",
          transform: "",
        }
      }
    )
    const burning = createBurningTexture(color, seed, grid.columns)
    const canvas =
      effectStyle === "burning"
        ? createBurningCanvas(
            element,
            color,
            seed,
            grid.columns,
            grid.rows + (shiftY ? 1 : 0),
            offsetY,
            () => grid
          )
        : null
    const releasePointer =
      effectStyle === "particles" ? trackEffectPointer() : () => {}
    let pointer: { x: number; y: number } | null = null
    const prepare = () => {
      canvas?.prepare()
      const position = effectPointer()
      const bounds =
        effectStyle === "particles" && position
          ? element.getBoundingClientRect()
          : null
      pointer =
        position && bounds
          ? {
              x: position.x - bounds.left,
              y: position.y - bounds.top + offsetY,
            }
          : null
    }
    const paint = (time?: number) => {
      if (canvas) {
        canvas.paint(time, reveal.current.value, amplitude)
        return
      }
      paintCells(time)
    }
    const paintCells = (time?: number) => {
      cells.forEach((entry) => {
        const { cell, x, y, particle } = entry
        const appearance = particle
          ? particle(time, reveal.current.value, amplitude, pointer)
          : {
              backgroundColor: burning(
                x,
                y,
                time,
                reveal.current.value,
                amplitude
              ),
              transform: "none",
            }
        if (entry.backgroundColor !== appearance.backgroundColor) {
          cell.style.backgroundColor = appearance.backgroundColor
          entry.backgroundColor = appearance.backgroundColor
        }
        if (entry.transform !== appearance.transform) {
          cell.style.transform = appearance.transform
          entry.transform = appearance.transform
        }
      })
    }
    let unsubscribe: (() => void) | undefined
    const resume = () => {
      unsubscribe ??= subscribeBurningFrame(paint, prepare)
    }
    const pause = () => {
      unsubscribe?.()
      unsubscribe = undefined
    }
    // Resume near the viewport boundary using the shared animation time.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) resume()
        else pause()
      },
      { rootMargin: "100px" }
    )
    observer.observe(element)
    resume()
    return () => {
      observer.disconnect()
      pause()
      releasePointer()
      canvas?.dispose()
      paintCells()
    }
  }, [
    effectStyle,
    offsetY,
    animated,
    transitioning,
    phase,
    amplitude,
    visible,
    grid,
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
