import { useEffect, useState, type RefObject } from "react"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { placeItems, positionsOnly, type GridPlacement } from "@/lib/grid/grid-layout"
import type { GridItem } from "@/lib/grid/types"

export function useBulkDrag({
  active, gridRef, items, placements, columns, columnStep, rowStep,
}: {
  active: boolean
  gridRef: RefObject<HTMLDivElement | null>
  items: GridItem[]
  placements: Record<string, GridPlacement>
  columns: number
  columnStep: number
  rowStep: number
}) {
  const [preview, setPreview] = useState<Record<string, GridPlacement> | null>(null)
  useEffect(() => {
    const grid = gridRef.current
    if (!active || !grid) return
    const viewport = grid.closest<HTMLElement>("[data-grid-scroll]")
    let gesture: {
      pointerId: number
      x: number
      y: number
      scrollTop: number
      scrollLeft: number
      ids: string[]
      minX: number
      minY: number
      maxX: number
    } | null = null
    let next: Record<string, GridPlacement> | null = null
    let deltaX = 0
    let deltaY = 0
    let current = { x: 0, y: 0 }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || gesture) return
      const target = event.target
      if (!(target instanceof Element)) return
      const tile = target.closest<HTMLElement>("[data-grid-item-id]")
      const ids = useGridSelectionStore.getState().ids.filter((id) => placements[id])
      if (!tile?.dataset.gridItemId || !ids.includes(tile.dataset.gridItemId)) return
      const selected = ids.map((id) => placements[id])
      gesture = {
        pointerId: event.pointerId, x: event.clientX, y: event.clientY,
        scrollTop: viewport?.scrollTop ?? 0, scrollLeft: viewport?.scrollLeft ?? 0,
        ids,
        minX: Math.min(...selected.map((value) => value.x)),
        minY: Math.min(...selected.map((value) => value.y)),
        maxX: Math.max(...selected.map((value) => value.x + value.width)),
      }
      current = { x: event.clientX, y: event.clientY }
      event.preventDefault()
    }
    const update = () => {
      if (!gesture) return
      const x = current.x - gesture.x + (viewport?.scrollLeft ?? 0) - gesture.scrollLeft
      const y = current.y - gesture.y + (viewport?.scrollTop ?? 0) - gesture.scrollTop
      if (!next && Math.hypot(x, y) < 5) return
      const dx = Math.max(-gesture.minX, Math.min(columns - gesture.maxX, Math.round(x / columnStep)))
      const dy = Math.max(-gesture.minY, Math.round(y / rowStep))
      if (next && dx === deltaX && dy === deltaY) return
      deltaX = dx
      deltaY = dy
      const positions = positionsOnly(placements)
      for (const id of gesture.ids) {
        positions[id] = { x: placements[id].x + dx, y: placements[id].y + dy }
      }
      next = placeItems(items, columns, positions, undefined, gesture.ids)
      setPreview(next)
    }
    const move = (event: PointerEvent) => {
      if (event.pointerId !== gesture?.pointerId) return
      current = { x: event.clientX, y: event.clientY }
      update()
      event.preventDefault()
    }
    const cancel = () => {
      gesture = null
      next = null
      deltaX = deltaY = 0
      setPreview(null)
    }
    const up = (event: PointerEvent) => {
      if (event.pointerId !== gesture?.pointerId) return
      current = { x: event.clientX, y: event.clientY }
      update()
      if (next) {
        const suppressClick = (click: MouseEvent) => {
          click.preventDefault()
          click.stopPropagation()
        }
        window.addEventListener("click", suppressClick, { capture: true, once: true })
        setTimeout(() => window.removeEventListener("click", suppressClick, true), 0)
        if (deltaX || deltaY)
          useTabGridStore.getState().setLayout(columns, positionsOnly(next))
      }
      cancel()
    }
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape" && gesture) {
        event.preventDefault()
        cancel()
      }
    }
    grid.addEventListener("pointerdown", down, true)
    viewport?.addEventListener("scroll", update)
    window.addEventListener("pointermove", move, { passive: false })
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", cancel)
    window.addEventListener("blur", cancel)
    window.addEventListener("keydown", key, true)
    return () => {
      cancel()
      grid.removeEventListener("pointerdown", down, true)
      viewport?.removeEventListener("scroll", update)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cancel)
      window.removeEventListener("blur", cancel)
      window.removeEventListener("keydown", key, true)
    }
  }, [active, gridRef, items, placements, columns, columnStep, rowStep])
  return preview
}
