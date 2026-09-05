import { useEffect, useRef, useState } from "react"
import TabIcon from "./tab-icon"
import type { TabItem } from "./types"
import { textureSeed, burningCell } from "./burning-texture"
import { subscribeBurningFrame } from "./burning-clock"

const CELL_SIZE = 8
const GAP = 1

export default function TabBackground({
  item,
  textureId = item.id,
  offsetY = 0,
  animated = false,
}: {
  item: TabItem
  textureId?: string
  offsetY?: number
  animated?: boolean
}) {
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
    if (!animated || !grid.columns || !region.current) return
    const cells = Array.from(
      region.current.querySelectorAll<HTMLElement>("[data-burn-cell]")
    )
    const paint = (time?: number) =>
      cells.forEach((cell, index) => {
        cell.style.backgroundColor = burningCell(
          item.color,
          seed,
          index % grid.columns,
          firstRow + Math.floor(index / grid.columns),
          grid.columns,
          time
        )
      })
    const unsubscribe = subscribeBurningFrame(paint)
    return () => {
      unsubscribe()
      paint()
    }
  }, [animated, grid.columns, grid.rows, item.color, seed, firstRow, shiftY])

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden rounded-[inherit] bg-card"
    >
      <div
        ref={region}
        className="absolute inset-y-0 right-0 w-[65%] overflow-hidden"
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
                    backgroundColor: burningCell(
                      item.color,
                      seed,
                      x,
                      y,
                      grid.columns
                    ),
                  }}
                />
              )
            }
          )}
        </div>
      </div>
      <div className="absolute inset-y-0 right-5 z-10 flex items-center opacity-90">
        <TabIcon
          key={item.url}
          url={item.url}
          className={item.size === "small" ? "size-7" : "size-12"}
        />
      </div>
    </div>
  )
}
