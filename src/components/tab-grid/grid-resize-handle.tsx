import { useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import type { GridItem } from "@/lib/grid/types"
import type { GridPlacement } from "@/lib/grid/grid-layout"
import { GRID_CELL_SIZE, GRID_GAP } from "@/lib/grid/grid-layout"
import { getComponentSizeOptions } from "@/lib/grid/registry"
import { resolveResizeSize } from "@/lib/grid/resize"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

type Session = {
  pointerId: number
  x: number
  y: number
  item: GridItem
  width: number
  height: number
  size: GridItem["size"]
}

export type GridResizeControls = {
  columns: number
  columnStep: number
  rowStep: number
  onPreview: (id: string, size: GridItem["size"] | null) => void
  onCommit: (id: string, size: GridItem["size"]) => void
}

export default function GridResizeHandle({
  item,
  placement,
  columns,
  columnStep,
  rowStep,
  onPreview,
  onCommit,
}: GridResizeControls & { item: GridItem; placement: GridPlacement }) {
  const { t } = useTranslation()
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  const session = useRef<Session | null>(null)
  const frame = useRef<number | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const [resizing, setResizing] = useState(false)
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    []
  )
  const resizable =
    getComponentSizeOptions(item.kind, "resize").filter(
      (size) => size.width <= columns
    ).length > 1
  const update = (point: { x: number; y: number }) => {
    const active = session.current
    if (!active) return
    const size = resolveResizeSize(
      active.item,
      columns,
      active.width + (point.x - active.x) / columnStep,
      active.height + (point.y - active.y) / rowStep,
      { currentSize: active.size, hysteresis: 0.12 }
    )
    if (size !== active.size) {
      active.size = size
      onPreview(item.id, size)
    }
  }
  const finish = (commit: boolean) => {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    pointer.current = null
    const active = session.current
    if (!active) return
    session.current = null
    setResizing(false)
    if (commit && active.size !== active.item.size)
      onCommit(item.id, active.size)
    onPreview(item.id, null)
  }
  // The line follows the effective lower-right corner, including large radii on short tiles.
  const corner = Math.min(
    radius,
    (placement.height * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP) / 2,
    (placement.width * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP) / 2
  )
  const handleSize = Math.max(28, corner + 14)
  const bend = Math.max(0, corner - 6)
  const edge = handleSize - 6
  if (!resizable) return null
  return (
    <button
      type="button"
      aria-label={t("grid.chrome.resizeItem", { name: item.name })}
      title={`${placement.width}×${placement.height}`}
      className={`absolute right-0 bottom-0 z-40 cursor-nwse-resize touch-none rounded-br-[inherit] ${resizing ? "text-foreground" : "text-foreground/70"} hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring`}
      style={{ width: handleSize, height: handleSize }}
      onPointerDown={(event) => {
        if (event.button !== 0 || session.current) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.focus({ preventScroll: true })
        event.currentTarget.setPointerCapture(event.pointerId)
        session.current = {
          pointerId: event.pointerId,
          x: event.clientX,
          y: event.clientY,
          item,
          width: placement.width,
          height: placement.height,
          size: item.size,
        }
        setResizing(true)
      }}
      onPointerMove={(event) => {
        if (session.current?.pointerId !== event.pointerId) return
        pointer.current = { x: event.clientX, y: event.clientY }
        if (frame.current !== null) return
        frame.current = requestAnimationFrame(() => {
          frame.current = null
          if (pointer.current) update(pointer.current)
        })
      }}
      onPointerUp={(event) => {
        if (session.current?.pointerId !== event.pointerId) return
        update({ x: event.clientX, y: event.clientY })
        finish(true)
      }}
      onPointerCancel={(event) => {
        if (session.current?.pointerId === event.pointerId) finish(false)
      }}
      onLostPointerCapture={(event) => {
        if (session.current?.pointerId === event.pointerId) finish(false)
      }}
      onKeyDown={(event) => {
        if (event.key === "Escape" && session.current) {
          event.stopPropagation()
          finish(false)
          return
        }
        const dx =
          event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0
        const dy =
          event.key === "ArrowDown" ? 1 : event.key === "ArrowUp" ? -1 : 0
        if (!dx && !dy) return
        event.preventDefault()
        event.stopPropagation()
        const size = resolveResizeSize(
          item,
          columns,
          placement.width + dx * 2,
          placement.height + dy * 2
        )
        if (size !== item.size) onCommit(item.id, size)
      }}
    >
      <svg
        aria-hidden="true"
        width="100%"
        height="100%"
        viewBox={`0 0 ${handleSize} ${handleSize}`}
        fill="none"
      >
        <path
          d={`M ${edge} 6 V ${edge - bend} ${bend > 0 ? `A ${bend} ${bend} 0 0 1 ${edge - bend} ${edge}` : ""} H 6`}
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    </button>
  )
}
