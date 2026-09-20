import { createPixiEffect } from "./pixi-effect"
import { createParticleCell, particleCell } from "./particle-texture"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useVisualTransition } from "./use-visual-transition"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  textureSeed,
  burningCell,
  createBurningTexture,
} from "./burning-texture"
import { subscribeBurningFrame } from "./burning-clock"
import type { EffectStyle } from "@/stores/home-settings-store"

const CELL_SIZE = 8
const GAP = 1

// Pixel pitch of one cell+gap along each axis for a measured surface.
function stepsOf(grid: {
  width: number
  height: number
  columns: number
  rows: number
}) {
  return {
    stepX: (grid.width + GAP) / grid.columns,
    stepY: (grid.height + GAP) / grid.rows,
  }
}

export default function EffectSurface({
  color,
  textureId,
  effectStyle: effectStyleOverride,
  offsetY = 0,
  coverage = 65,
  animated = false,
  visible = true,
  entrance = false,
  glass = false,
}: {
  color: string
  textureId: string
  effectStyle?: EffectStyle
  offsetY?: number
  coverage?: number
  animated?: boolean
  visible?: boolean
  entrance?: boolean
  glass?: boolean
}) {
  const configuredEffectStyle = useHomeSettingsStore(
    (state) => state.tabTexture
  )
  const effectStyle = effectStyleOverride ?? configuredEffectStyle
  const amplitude = useHomeSettingsStore((state) => state.burningAmplitude)
  const {
    progress: reveal,
    initial: initialVisibility,
    phase,
  } = useVisualTransition(visible, { appear: entrance })
  const entering = phase === "entering"
  const transitioning = entering || phase === "exiting"
  const region = useRef<HTMLDivElement>(null)
  const pixi = useRef<ReturnType<typeof createPixiEffect> | null>(null)
  const [grid, setGrid] = useState({ columns: 0, rows: 0, width: 0, height: 0 })
  const effectState = useRef({ color, grid })
  const hidden = phase === "hidden" && !transitioning
  const hasGrid = !!grid.columns
  const seed = textureSeed(textureId)
  // Per-axis cell geometry derived from the measured surface: step = cell +
  // gap. Fractional steps are fine — DOM spans and pixi sprites both take
  // sub-pixel sizes without visible seams at 1px gaps.
  const stepX = hasGrid ? (grid.width + GAP) / grid.columns : CELL_SIZE + GAP
  const stepY = hasGrid ? (grid.height + GAP) / grid.rows : CELL_SIZE + GAP
  const cellW = stepX - GAP
  const cellH = stepY - GAP
  const firstRow = Math.floor(offsetY / stepY)
  const shiftY = offsetY % stepY

  useLayoutEffect(() => {
    const element = region.current
    if (!element) return
    const updateGrid = ({
      width,
      height,
    }: {
      width: number
      height: number
    }) => {
      // Cells are sized to fill the surface exactly: the row/column count
      // is rounded (not ceiled) to the nearest 9px step, then the cell
      // edge shrinks or grows a fraction of a pixel so the last cell ends
      // flush with the edge — no clipped partial row anywhere.
      const columns = Math.max(1, Math.round(width / (CELL_SIZE + GAP)))
      const rows = Math.max(1, Math.round(height / (CELL_SIZE + GAP)))
      setGrid((current) =>
        current.columns === columns &&
        current.rows === rows &&
        current.width === width &&
        current.height === height
          ? current
          : { columns, rows, width, height }
      )
    }
    updateGrid(element.getBoundingClientRect())
    const observer = new ResizeObserver(([entry]) => {
      updateGrid(entry.contentRect)
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    effectState.current = { color, grid }
  }, [color, grid])

  useEffect(() => {
    if (effectStyle === "none" || hidden || !hasGrid || !region.current) return
    const initial = effectState.current
    const effect = createPixiEffect(
      region.current,
      initial.color,
      seed,
      initial.grid.columns,
      initial.grid.rows + (shiftY ? 1 : 0),
      offsetY,
      initial.grid,
      stepsOf(initial.grid),
      effectStyle
    )
    pixi.current = effect
    return () => {
      if (pixi.current === effect) pixi.current = null
      effect.dispose()
    }
  }, [effectStyle, offsetY, hidden, hasGrid, seed, shiftY])

  useEffect(() => {
    const effect = pixi.current
    if (
      effect &&
      !effect.update(
        color,
        grid.columns,
        grid.rows + (shiftY ? 1 : 0),
        grid,
        stepsOf(grid)
      )
    )
      pixi.current = null
  }, [color, grid, shiftY])

  useEffect(() => {
    if (
      effectStyle === "none" ||
      (phase === "hidden" && !transitioning) ||
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
    const pointer = null
    const prepare = () => {
      pixi.current?.prepare()
    }
    const paint = (time?: number) => {
      const effect = pixi.current
      if (effect) {
        if (effect.paint(time, reveal.current.value, amplitude, pointer)) return
        pixi.current = null
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
      if ((!animated || amplitude === 0) && !transitioning) {
        prepare()
        paint()
        return
      }
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
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] [contain:layout_paint_style] ${glass ? "bg-card/55 backdrop-blur-xl" : "bg-card"}`}
    >
      <div
        ref={region}
        className="absolute inset-y-0 right-0 overflow-hidden"
        style={{ width: `${coverage}%` }}
      >
        {effectStyle !== "none" && (
          <div
            className="absolute top-0 right-0 grid"
            style={{
              gridTemplateColumns: `repeat(${Math.max(1, grid.columns)}, ${cellW}px)`,
              gridAutoRows: `${cellH}px`,
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
        )}
      </div>
    </div>
  )
}
