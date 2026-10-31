import { useCallback, useEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { isSquareTabSize, type GridItem } from "@/lib/grid/types"
import type { GridPlacement } from "@/lib/grid/grid-layout"
import { GRID_CELL_SIZE, GRID_GAP } from "@/lib/grid/grid-layout"
import {
  getComponentDefinition,
  getComponentSizeOptions,
} from "@/lib/grid/registry"
import { resolveResizeSize } from "@/lib/grid/resize"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import GridTileContent from "./grid-tile-content"
import { useGridMotion } from "./use-grid-motion"
import { useGridResizeMotion } from "./use-grid-resize-motion"

const ignoreOpen = () => {}

type Session = {
  pointerId: number
  x: number
  y: number
  item: GridItem
  width: number
  height: number
  size: GridItem["size"]
}

export default function GridResizeItem({
  item,
  placement,
  columns,
  columnStep,
  rowStep,
  onPreview,
  onCommit,
  onAnchorChange,
  showResizeHandle = false,
}: {
  item: GridItem
  placement: GridPlacement
  columns: number
  columnStep: number
  rowStep: number
  onPreview: (id: string, size: GridItem["size"] | null) => void
  onCommit: (id: string, size: GridItem["size"]) => void
  onAnchorChange?: (element: HTMLElement | null) => void
  showResizeHandle?: boolean
}) {
  const { t } = useTranslation()
  const radius = useHomeSettingsStore((state) =>
    item.kind === "folder"
      ? state.folderRadius
      : item.kind === "tab"
        ? (isSquareTabSize(item.size)
            ? state.squareTabAppearance
            : state.tabAppearance
          ).radius
        : 16
  )
  const session = useRef<Session | null>(null)
  const frame = useRef<number | null>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const [resizing, setResizing] = useState(false)
  const setAnchor = useCallback(
    (element: HTMLElement | null) => onAnchorChange?.(element),
    [onAnchorChange]
  )
  const motionRef = useGridMotion(placement, false, setAnchor)
  const visualRef = useGridResizeMotion(placement, columnStep, rowStep)
  useEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    },
    []
  )
  const definition = getComponentDefinition(item.kind)
  const resizable =
    (item.kind === "tab" || item.kind === "folder") &&
    getComponentSizeOptions(item.kind, "editor", item.size).filter(
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
  return (
    <article
      ref={motionRef}
      data-grid-item-id={item.id}
      data-grid-editing
      className="group relative isolate min-w-0 rounded-2xl"
      style={{
        borderRadius: radius,
        gridColumn: `${placement.x + 1} / span ${placement.width}`,
        gridRow: `${placement.y + 1} / span ${placement.height}`,
      }}
    >
      <div
        ref={visualRef}
        data-grid-resize-surface
        className={`relative h-full w-full origin-top-left rounded-[inherit] ${definition.tileBorder ? (item.kind === "folder" ? "border border-transparent" : "border border-tile-border") : ""}`}
      >
        <div
          inert
          className="pointer-events-none relative h-full overflow-hidden rounded-[inherit]"
        >
          <GridTileContent item={item} preview onOpen={ignoreOpen} />
        </div>
        {resizable && (
          <button
            type="button"
            aria-label={t("grid.chrome.resizeItem", { name: item.name })}
            title={`${placement.width}×${placement.height}`}
            className={`absolute right-0 bottom-0 z-40 cursor-nwse-resize touch-none rounded-br-[inherit] text-foreground/70 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-ring [@media(hover:none)]:opacity-100 ${resizing || showResizeHandle ? "opacity-100" : "opacity-0"}`}
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
                event.key === "ArrowRight"
                  ? 1
                  : event.key === "ArrowLeft"
                    ? -1
                    : 0
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
        )}
      </div>
    </article>
  )
}
