import { useEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { useGridSelectionStore } from "@/stores/grid-selection-store"

export default function MarqueeSelection() {
  const rectangle = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const viewport = document.querySelector<HTMLElement>("[data-grid-scroll]")
    const box = rectangle.current
    if (!viewport || !box) return
    const previousCursor = viewport.style.cursor
    viewport.style.cursor = "crosshair"
    let start: {
      x: number
      y: number
      scrollTop: number
      scrollLeft: number
    } | null = null
    let pointerId: number | null = null
    let baseIds: string[] = []
    let previousIds: string[] = []
    let dragged = false
    let suppressClick = false
    let clickTimer: ReturnType<typeof setTimeout> | undefined
    let current = { x: 0, y: 0 }

    const update = () => {
      if (!start) return
      const originX = start.x - (viewport.scrollLeft - start.scrollLeft)
      const originY = start.y - (viewport.scrollTop - start.scrollTop)
      if (!dragged && Math.hypot(current.x - originX, current.y - originY) < 4)
        return
      dragged = true
      const bounds = viewport.getBoundingClientRect()
      const left = Math.max(bounds.left, Math.min(originX, current.x))
      const top = Math.max(bounds.top, Math.min(originY, current.y))
      const right = Math.min(bounds.right, Math.max(originX, current.x))
      const bottom = Math.min(bounds.bottom, Math.max(originY, current.y))
      Object.assign(box.style, {
        display: "block",
        left: `${left}px`,
        top: `${top}px`,
        width: `${Math.max(0, right - left)}px`,
        height: `${Math.max(0, bottom - top)}px`,
      })
      const ids = new Set(baseIds)
      viewport
        .querySelectorAll<HTMLElement>("[data-grid-item-id]")
        .forEach((tile) => {
          const rect = tile.getBoundingClientRect()
          if (
            right > left &&
            bottom > top &&
            tile.dataset.gridItemId &&
            rect.width > 0 &&
            rect.height > 0 &&
            rect.right > left &&
            rect.left < right &&
            rect.bottom > top &&
            rect.top < bottom
          )
            ids.add(tile.dataset.gridItemId)
        })
      useGridSelectionStore.getState().setIds([...ids])
    }
    const down = (event: PointerEvent) => {
      if (event.button !== 0 || !event.isPrimary || pointerId !== null) return
      const target = event.target
      if (!(target instanceof Element) || !viewport.contains(target)) return
      if (target.closest('[role="dialog"], [role="menu"]')) return
      const tile = target.closest<HTMLElement>("[data-grid-item-id]")
      if (
        tile?.dataset.gridItemId &&
        useGridSelectionStore.getState().ids.includes(tile.dataset.gridItemId)
      )
        return
      if (
        !target.closest("[data-grid-item-id]") &&
        target.closest("button, input, textarea, a")
      )
        return
      start = {
        x: event.clientX,
        y: event.clientY,
        scrollTop: viewport.scrollTop,
        scrollLeft: viewport.scrollLeft,
      }
      current = { x: event.clientX, y: event.clientY }
      pointerId = event.pointerId
      previousIds = useGridSelectionStore.getState().ids
      baseIds =
        event.shiftKey || event.metaKey || event.ctrlKey ? previousIds : []
      dragged = false
      event.preventDefault()
    }
    const move = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      current = { x: event.clientX, y: event.clientY }
      update()
      event.preventDefault()
    }
    const end = () => {
      if (dragged) {
        suppressClick = true
        clearTimeout(clickTimer)
        clickTimer = setTimeout(() => {
          suppressClick = false
        }, 0)
      }
      start = null
      pointerId = null
      dragged = false
      box.style.display = "none"
    }
    const up = (event: PointerEvent) => {
      if (event.pointerId !== pointerId) return
      current = { x: event.clientX, y: event.clientY }
      update()
      end()
    }
    const cancel = () => {
      if (start) useGridSelectionStore.getState().setIds(previousIds)
      end()
    }
    const click = (event: MouseEvent) => {
      if (!suppressClick) return
      event.preventDefault()
      event.stopPropagation()
    }
    viewport.addEventListener("pointerdown", down, true)
    viewport.addEventListener("scroll", update)
    window.addEventListener("pointermove", move, { passive: false })
    window.addEventListener("pointerup", up)
    window.addEventListener("pointercancel", cancel)
    window.addEventListener("blur", cancel)
    window.addEventListener("click", click, true)
    return () => {
      viewport.style.cursor = previousCursor
      clearTimeout(clickTimer)
      viewport.removeEventListener("pointerdown", down, true)
      viewport.removeEventListener("scroll", update)
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
      window.removeEventListener("pointercancel", cancel)
      window.removeEventListener("blur", cancel)
      window.removeEventListener("click", click, true)
    }
  }, [])
  return createPortal(
    <div
      ref={rectangle}
      aria-hidden="true"
      className="pointer-events-none fixed z-40 hidden rounded-md border border-primary bg-primary/15"
    />,
    document.body
  )
}
