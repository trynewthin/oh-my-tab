import { createPixiEffect, type PixiEffect } from "./pixi-effect"
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

import { textureGrid, TEXTURE_CELL_SIZE, TEXTURE_GAP } from "./texture-grid"

export default function EffectSurface({
  color,
  textureId,
  effectStyle: effectStyleOverride,
  textureRow = 0,
  coverage = 65,
  animated = false,
  visible = true,
  entrance = false,
  glass = false,
  transparent = false,
}: {
  color: string
  textureId: string
  effectStyle?: EffectStyle
  textureRow?: number
  coverage?: number
  animated?: boolean
  visible?: boolean
  entrance?: boolean
  glass?: boolean
  transparent?: boolean
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
  const pixi = useRef<PixiEffect | null>(null)
  const [grid, setGrid] = useState(() => textureGrid(0, 0))
  const fill = Math.min(1, Math.max(0, (coverage - 65) / 35))
  const effectState = useRef({ color, grid })
  const hidden = phase === "hidden" && !transitioning
  const hasGrid = grid.columns > 0 && grid.rows > 0
  const seed = textureSeed(textureId)

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
      // display:none (drag hide, portal teardown) reports 0x0; ignoring it
      // keeps the last real grid instead of collapsing to a sliver.
      if (!width || !height) return
      const next = textureGrid(width, height)
      setGrid((current) =>
        current.columns === next.columns &&
        current.rows === next.rows &&
        current.width === width &&
        current.height === height
          ? current
          : next
      )
    }
    updateGrid({ width: element.clientWidth, height: element.clientHeight })
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
      initial.grid,
      textureRow,
      effectStyle,
      fill
    )
    pixi.current = effect
    return () => {
      if (pixi.current === effect) pixi.current = null
      effect.dispose()
    }
  }, [effectStyle, textureRow, hidden, hasGrid, seed, fill])

  useEffect(() => {
    const effect = pixi.current
    if (effect && !effect.update(color, grid)) pixi.current = null
  }, [color, grid])

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
        const y = textureRow + Math.floor(index / grid.columns)
        return {
          cell,
          x,
          y,
          particle:
            effectStyle === "particles"
              ? createParticleCell(color, seed, x, y, grid.columns, fill)
              : null,
          backgroundColor: "",
          transform: "",
        }
      }
    )
    const burning = createBurningTexture(color, seed, grid.columns, fill)
    const pointer = null
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
        paint()
        return
      }
      unsubscribe ??= subscribeBurningFrame(paint)
    }
    const pause = () => {
      unsubscribe?.()
      unsubscribe = undefined
    }
    // React may reuse cells across a resize; replace styles painted by the old
    // effect cleanup before letting the canvas take over again.
    paintCells()
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
    textureRow,
    animated,
    transitioning,
    phase,
    amplitude,
    visible,
    grid,
    color,
    seed,
    reveal,
    fill,
  ])

  return (
    <div
      aria-hidden="true"
      data-burning-entrance={entering ? "running" : undefined}
      data-effect-phase={phase}
      data-effect-style={effectStyle}
      className={`pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] [contain:layout_paint_style] ${transparent ? "" : glass ? "bg-card/55 backdrop-blur-xl" : "bg-card"}`}
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
              gridTemplateColumns: `repeat(${Math.max(1, grid.columns)}, ${TEXTURE_CELL_SIZE}px)`,
              gridAutoRows: `${TEXTURE_CELL_SIZE}px`,
              gap: TEXTURE_GAP,
              top: grid.top,
            }}
          >
            {Array.from({ length: grid.columns * grid.rows }, (_, index) => {
              const x = index % grid.columns
              const y = textureRow + Math.floor(index / grid.columns)
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
                          null,
                          fill
                        )
                      : {
                          backgroundColor: burningCell(
                            color,
                            seed,
                            x,
                            y,
                            grid.columns,
                            undefined,
                            initialVisibility,
                            amplitude,
                            fill
                          ),
                          transform: "none",
                        }),
                  }}
                />
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
