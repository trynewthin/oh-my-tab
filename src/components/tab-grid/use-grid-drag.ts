import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from "react"
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core"

import { itemWidth, placeItems } from "@/lib/grid/grid-layout"
import type {
  GridPlacement,
  GridPosition,
  GridPositions,
} from "@/lib/grid/grid-layout"
import type { GridItem, TabItem, TodoTask } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import type { GridDragData } from "./drag-types"
import {
  confirmedFolderDrop,
  draggedBounds,
  FOLDER_CHARGE_DURATION,
  FOLDER_RELEASE_DURATION,
  overlapRatio,
  retainedFolderDrop,
} from "./folder-drop"
import { containsPoint, gridPositionFromPoint } from "./drag/geometry"
import {
  FOLDER_GAP_ID,
  TODO_GAP_ID,
  reorderTodoTasks,
  type Bounds,
  type DragSession,
  type Intent,
  type Point,
} from "./drag/model"

const FOLDER_DROP_INSET = 0.08
const FOLDER_DROP_EXIT_INSET = 0.04

// Encapsulates the whole drag lifecycle: session capture, the per-frame intent
// state machine (grid / folder-charge / folder-reorder), and the two rAF timers
// that drive charge and release animation. The component supplies the live
// layout inputs each frame so the hook never reads stale geometry.
export function useGridDrag({
  items,
  widthColumns,
  width,
  gridGap,
  gridRef,
  pointer,
  closeFolder,
  resolvePlacements,
  commitLayout,
  resolveDrop,
}: {
  items: GridItem[]
  /** Column count derived from container width (ignores any drag freeze). */
  widthColumns: number
  /** Container width in px; steps are derived from it and the active columns. */
  width: number
  gridGap: number
  gridRef: MutableRefObject<HTMLDivElement | null>
  pointer: MutableRefObject<Point | null>
  closeFolder: () => void
  /** Base placements for a column count, from the stored layout (no preview). */
  resolvePlacements: (columns: number) => Record<string, GridPlacement>
  /** Where a grid drop lands. Defaults to the store; previews pass local state. */
  commitLayout?: (columns: number, positions: GridPositions) => void
  /**
   * Overrides how a grid drop resolves placements. Returning null rejects the
   * drop (tiles revert). Defaults to placeItems against the session snapshot.
   */
  resolveDrop?: (
    positions: GridPositions,
    target: { id: string; position: GridPosition }
  ) => GridPositions | null
}) {
  const setLayout = useTabGridStore((state) => state.setLayout)
  const transferTab = useTabGridStore((state) => state.transferTab)
  const updateTodoTasks = useTabGridStore((state) => state.updateTodoTasks)
  const [dragging, setDragging] = useState<DragSession | null>(null)
  const sessionRef = useRef<DragSession | null>(null)
  const [intent, setIntent] = useState<Intent>({ kind: "none" })
  const intentRef = useRef<Intent>({ kind: "none" })
  const [heldLayout, setHeldLayout] = useState<GridPositions | null>(null)
  const [dialogSuspended, setDialogSuspended] = useState(false)
  const hover = useRef<{
    folderId: string
    startedAt: number
    frame: number
  } | null>(null)
  const release = useRef<{
    startedAt: number
    frame: number
    from: number
  } | null>(null)

  // Frozen while a drag session is live; otherwise the width-derived count.
  const columns = dragging?.columns ?? widthColumns
  const columnStep = (width + gridGap) / columns
  const rowStep = columnStep

  function publish(next: Intent) {
    intentRef.current = next
    setIntent((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next
    )
  }
  function clearHover() {
    if (hover.current) cancelAnimationFrame(hover.current.frame)
    hover.current = null
    setHeldLayout(null)
  }
  function clearRelease() {
    if (release.current) cancelAnimationFrame(release.current.frame)
    release.current = null
  }
  function resetDrag() {
    clearHover()
    clearRelease()
    sessionRef.current = null
    setDragging(null)
    publish({ kind: "none" })
    setDialogSuspended(false)
  }
  const cancelTimers = useCallback(() => {
    if (hover.current) cancelAnimationFrame(hover.current.frame)
    if (release.current) cancelAnimationFrame(release.current.frame)
  }, [])
  useEffect(() => cancelTimers, [cancelTimers])

  function folderBounds(id: string): Bounds | null {
    const element = Array.from(gridRef.current?.children ?? []).find(
      (node) => node.getAttribute("data-grid-item-id") === id
    )
    return element?.getBoundingClientRect() ?? null
  }
  function insertionIndex(id: string, point: Point, session: DragSession) {
    const folder = items.find((item) => item.id === id)
    if (folder?.kind !== "folder") return 0
    const remaining = folder.tabs.filter((tab) => tab.id !== session.item.id)
    const surface = Array.from(
      document.querySelectorAll<HTMLElement>("[data-folder-surface]")
    ).find(
      (node) =>
        node.dataset.folderId === id &&
        node.dataset.folderSurface ===
          (session.dialogBounds && !session.dialogExited ? "dialog" : "preview")
    )
    if (!surface) return remaining.length
    const viewport = surface.getBoundingClientRect()
    const rows = Array.from(
      surface.querySelectorAll<HTMLElement>("[data-stack-row]")
    )
    for (const row of rows) {
      if (
        !row.dataset.tabId ||
        row.dataset.tabId === session.item.id ||
        row.dataset.tabId === FOLDER_GAP_ID ||
        row.inert
      )
        continue
      const rect = row.getBoundingClientRect()
      if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue
      if (
        surface.dataset.folderSurface === "dialog" && window.innerWidth >= 1024
          ? point.y < rect.top ||
            (point.y <= rect.bottom && point.x < rect.left + rect.width / 2)
          : point.y < rect.top + rect.height / 2
      )
        return Math.max(
          0,
          remaining.findIndex((tab) => tab.id === row.dataset.tabId)
        )
    }
    const visible = rows.filter(
      (row) =>
        !row.inert &&
        row.dataset.tabId &&
        row.dataset.tabId !== session.item.id &&
        row.dataset.tabId !== FOLDER_GAP_ID &&
        row.getBoundingClientRect().top < viewport.bottom
    )
    const last = visible.at(-1)
    return last
      ? remaining.findIndex((tab) => tab.id === last.dataset.tabId) + 1
      : remaining.length
  }

  function todoInsertionIndex(id: string, point: Point, session: DragSession) {
    const todo = items.find((item) => item.id === id)
    if (todo?.kind !== "todo") return 0
    const remaining = todo.tasks.filter(
      (task) => task.id !== session.todoTask?.id
    )
    const surface = Array.from(
      document.querySelectorAll<HTMLElement>("[data-todo-surface]")
    ).find(
      (node) =>
        node.dataset.todoId === id &&
        node.dataset.todoSurface === session.sourceSurface
    )
    if (!surface) return remaining.length
    const rows = Array.from(
      surface.querySelectorAll<HTMLElement>("[data-stack-row]")
    )
    for (const row of rows) {
      if (
        !row.dataset.tabId ||
        row.dataset.tabId === session.todoTask?.id ||
        row.dataset.tabId === TODO_GAP_ID
      )
        continue
      const rect = row.getBoundingClientRect()
      if (
        point.y < rect.top ||
        (point.y <= rect.bottom && point.x < rect.left + rect.width / 2)
      )
        return Math.max(
          0,
          remaining.findIndex((task) => task.id === row.dataset.tabId)
        )
    }
    return remaining.length
  }

  function startDrag(event: DragStartEvent) {
    clearHover()
    // startDrag only fires while idle, so the base placements (from the stored
    // layout, no preview target) are the session's source of truth for origin
    // and the positions snapshot.
    const placements = resolvePlacements(columns)
    const data = event.active.data.current as GridDragData | undefined
    let item: GridItem | undefined
    let element: Element | null | undefined
    let sourceFolderId: string | undefined
    let sourceFolderIndex: number | undefined
    let sourceFolderColor: string | undefined
    let sourceTodoId: string | undefined
    let sourceTodoIndex: number | undefined
    let todoTask: TodoTask | undefined
    if (data?.type === "folder-tab") {
      const folder = items.find((entry) => entry.id === data.folderId)
      const tab =
        folder?.kind === "folder"
          ? folder.tabs.find((entry) => entry.id === data.tabId)
          : undefined
      if (!tab || folder?.kind !== "folder") return
      item = {
        ...tab,
        kind: "tab",
        size: tab.size ?? "small",
        color: tab.color ?? folder.color,
      } as TabItem
      sourceFolderId = folder.id
      sourceFolderIndex = folder.tabs.findIndex(
        (entry) => entry.id === data.tabId
      )
      sourceFolderColor = folder.color
      element = data.getElement()
    } else if (data?.type === "todo-task") {
      const todo = items.find((entry) => entry.id === data.todoId)
      todoTask =
        todo?.kind === "todo"
          ? todo.tasks.find((entry) => entry.id === data.taskId)
          : undefined
      if (!todoTask || todo?.kind !== "todo") return
      item = {
        id: todoTask.id,
        kind: "tab",
        name: todoTask.text,
        url: "",
        size: "small",
        color: todo.color,
      }
      sourceTodoId = todo.id
      sourceTodoIndex = todo.tasks.findIndex(
        (entry) => entry.id === data.taskId
      )
      element = data.getElement()
    } else {
      item = items.find((entry) => entry.id === event.active.id)
      element = Array.from(gridRef.current?.children ?? []).find(
        (node) =>
          node.getAttribute("data-grid-item-id") === String(event.active.id)
      )
    }
    const rect = element?.getBoundingClientRect()
    if (!item || !rect) return
    const mouse = event.activatorEvent instanceof MouseEvent
    const point = mouse
      ? {
          x: (event.activatorEvent as MouseEvent).clientX,
          y: (event.activatorEvent as MouseEvent).clientY,
        }
      : { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 }
    const session: DragSession = {
      columns,
      item,
      width: rect.width,
      height: rect.height,
      origin: placements[sourceFolderId ?? sourceTodoId ?? item.id],
      grabOffset: { x: point.x - rect.left, y: point.y - rect.top },
      pointerOrigin: point,
      mouse,
      positions: Object.fromEntries(
        Object.entries(placements).map(([id, { x, y }]) => [id, { x, y }])
      ),
      sourceFolderId,
      sourceFolderIndex,
      sourceFolderColor,
      sourceTodoId,
      sourceTodoIndex,
      todoTask,
      sourceSurface: data?.surface,
      dialogBounds: element
        ?.closest("[data-expanded-collection]")
        ?.getBoundingClientRect(),
      dialogExited: false,
    }
    sessionRef.current = session
    setDragging(session)
  }

  function currentRelease() {
    const currentIntent = intentRef.current
    return currentIntent.kind === "grid" ||
      currentIntent.kind === "folder" ||
      currentIntent.kind === "reorder" ||
      currentIntent.kind === "todo-reorder"
      ? currentIntent.releaseProgress
      : sessionRef.current?.sourceFolderId
        ? 0
        : 1
  }

  // releaseProgress only ever rises: an overlay extracted from a folder grows
  // into its grid tile on the way out and never shrinks again mid-drag.
  function animateRelease(delta: Point) {
    const current = currentRelease()
    if (!release.current) {
      release.current = {
        startedAt: performance.now(),
        frame: 0,
        from: current,
      }
    }
    const transition = release.current
    const duration = FOLDER_RELEASE_DURATION * (1 - transition.from)
    const elapsed = performance.now() - transition.startedAt
    const amount = duration === 0 ? 1 : Math.min(1, elapsed / duration)
    const progress = transition.from + (1 - transition.from) * amount
    cancelAnimationFrame(transition.frame)
    if (amount < 1)
      transition.frame = requestAnimationFrame(() => updateIntent(delta))
    else release.current = null
    return progress
  }

  function updateIntent(delta: Point) {
    const session = sessionRef.current
    const grid = gridRef.current?.getBoundingClientRect()
    if (!session || !grid) return
    const placements = resolvePlacements(columns)
    const point =
      session.mouse && pointer.current
        ? pointer.current
        : {
            x: session.pointerOrigin.x + delta.x,
            y: session.pointerOrigin.y + delta.y,
          }
    if (session.sourceTodoId) {
      clearHover()
      clearRelease()
      const surface = Array.from(
        document.querySelectorAll<HTMLElement>("[data-todo-surface]")
      ).find(
        (node) =>
          node.dataset.todoId === session.sourceTodoId &&
          node.dataset.todoSurface === session.sourceSurface
      )
      const bounds = session.dialogBounds ?? surface?.getBoundingClientRect()
      publish(
        bounds && containsPoint(point, bounds)
          ? {
              kind: "todo-reorder",
              todoId: session.sourceTodoId,
              index: todoInsertionIndex(session.sourceTodoId, point, session),
              releaseProgress: 1,
            }
          : { kind: "none" }
      )
      return
    }
    if (session.dialogBounds && !session.dialogExited) {
      if (containsPoint(point, session.dialogBounds)) {
        clearHover()
        clearRelease()
        publish({
          kind: "reorder",
          folderId: session.sourceFolderId!,
          index: insertionIndex(session.sourceFolderId!, point, session),
          releaseProgress: currentRelease(),
        })
        return
      }
      session.dialogExited = true
      setDialogSuspended(true)
    }
    if (session.sourceFolderId) {
      const sourceBounds = folderBounds(session.sourceFolderId)
      if (sourceBounds && containsPoint(point, sourceBounds)) {
        clearHover()
        clearRelease()
        publish({
          kind: "reorder",
          folderId: session.sourceFolderId,
          index: insertionIndex(session.sourceFolderId, point, session),
          releaseProgress: currentRelease(),
        })
        return
      }
    }
    if (session.item.kind === "tab") {
      const overlay = draggedBounds(point, session.grabOffset, {
        width: session.width,
        height: session.height,
      })
      let best: { folderId: string; color: string; ratio: number } | undefined
      for (const folder of items) {
        if (folder.kind !== "folder" || folder.id === session.sourceFolderId)
          continue
        const rect = folderBounds(folder.id)
        if (!rect) continue
        const ratio = overlapRatio(overlay, rect)
        const retained = hover.current?.folderId === folder.id
        if (
          !containsPoint(
            point,
            rect,
            retained ? FOLDER_DROP_EXIT_INSET : FOLDER_DROP_INSET,
            retained ? FOLDER_DROP_EXIT_INSET : FOLDER_DROP_INSET
          ) ||
          !(retained ? retainedFolderDrop(ratio) : confirmedFolderDrop(ratio))
        )
          continue
        if (!best || ratio > best.ratio)
          best = { folderId: folder.id, color: folder.color, ratio }
      }
      if (best) {
        if (hover.current?.folderId !== best.folderId) {
          if (hover.current) cancelAnimationFrame(hover.current.frame)
          hover.current = {
            folderId: best.folderId,
            startedAt: performance.now(),
            frame: 0,
          }
          setHeldLayout(
            Object.fromEntries(
              items.map((item) => [
                item.id,
                { x: placements[item.id].x, y: placements[item.id].y },
              ])
            )
          )
        }
        const candidate = hover.current!
        const progress = Math.min(
          1,
          (performance.now() - candidate.startedAt) / FOLDER_CHARGE_DURATION
        )
        const ready = progress >= 1
        cancelAnimationFrame(candidate.frame)
        if (!ready)
          candidate.frame = requestAnimationFrame(() => updateIntent(delta))
        // Approaching a folder never resizes the overlay — the folder glows
        // and previews the gap instead. releaseProgress freezes wherever it
        // is, so a grown overlay never shrinks back mid-drag.
        clearRelease()
        publish({
          kind: "folder",
          folderId: best.folderId,
          ready,
          progress,
          releaseProgress: currentRelease(),
          color: best.color,
        })
        return
      }
    }
    clearHover()
    if (
      point.x < grid.left - 16 ||
      point.x > grid.right + 16 ||
      point.y < grid.top - 24
    ) {
      clearRelease()
      publish({ kind: "none" })
      return
    }
    const position = gridPositionFromPoint({
      point,
      grabOffset: session.grabOffset,
      bounds: grid,
      columns,
      columnStep,
      rowStep,
      itemWidth: itemWidth(session.item, columns),
    })
    const progress = animateRelease(delta)
    publish({
      kind: "grid",
      position,
      holdLayout: false,
      releaseProgress: progress,
      ready: session.sourceFolderId ? progress >= 1 : true,
    })
  }

  function finishDrag(event: DragEndEvent) {
    const session = sessionRef.current
    if (!session) {
      resetDrag()
      return
    }
    const visibleAction = intentRef.current
    updateIntent(event.delta)
    let action = intentRef.current
    if (action.kind === "folder" && !action.ready)
      action =
        visibleAction.kind === "folder" ? { kind: "none" } : visibleAction
    if (action.kind === "grid" && session.sourceFolderId && !action.ready)
      action = { kind: "none" }
    let committed = false
    if (
      action.kind === "folder" &&
      action.ready &&
      session.item.kind === "tab"
    ) {
      transferTab({
        tabId: session.item.id,
        fromFolderId: session.sourceFolderId,
        toFolderId: action.folderId,
        columns,
      })
      committed = true
    } else if (action.kind === "reorder" && session.sourceFolderId) {
      transferTab({
        tabId: session.item.id,
        fromFolderId: session.sourceFolderId,
        toFolderId: action.folderId,
        index: action.index,
        columns,
      })
      committed = true
    } else if (
      action.kind === "todo-reorder" &&
      session.sourceTodoId &&
      session.todoTask
    ) {
      updateTodoTasks(session.sourceTodoId, (tasks) =>
        reorderTodoTasks(tasks, session.todoTask!, action.index)
      )
      committed = true
    } else if (action.kind === "grid" && action.ready) {
      if (session.sourceFolderId)
        transferTab({
          tabId: session.item.id,
          fromFolderId: session.sourceFolderId,
          columns,
          position: action.position,
        })
      else {
        const target = { id: session.item.id, position: action.position }
        const positions = resolveDrop
          ? resolveDrop(session.positions, target)
          : Object.fromEntries(
              Object.entries(
                placeItems(items, columns, session.positions, target)
              ).map(([id, { x, y }]) => [id, { x, y }])
            )
        if (positions) {
          if (commitLayout) commitLayout(columns, positions)
          else setLayout(columns, positions)
          committed = true
        }
      }
    }
    if (committed && session.dialogExited) closeFolder()
    resetDrag()
  }

  return {
    dragging,
    intent,
    heldLayout,
    dialogSuspended,
    startDrag,
    updateIntent,
    finishDrag,
    resetDrag,
    cancelTimers,
  }
}
