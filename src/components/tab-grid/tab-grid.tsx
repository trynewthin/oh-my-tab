import { useGridSelectionStore } from "@/stores/grid-selection-store"
import BulkActions from "./bulk-actions"
import { Plus } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"
import { columnsForWidth } from "./grid-layout"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import { createPortal } from "react-dom"
import {
  DndContext,
  DragOverlay,
  defaultDropAnimationSideEffects,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core"
import { useTabGridStore } from "@/stores/tab-grid-store"
import DraggableGridItem from "./draggable-grid-item"
import GridTileContent from "./grid-tile-content"
import GridItemDialog from "./grid-item-dialog"
import FolderExpansion from "./folder-expansion"
import {
  itemHeight,
  placeItems,
  type GridPosition,
  type GridPositions,
} from "./grid-layout"
import type { GridItem, TabItem } from "./types"
import type { FolderTabDragData } from "./drag-types"

const emptyPositions: GridPositions = {}
const ROW_STEP = 56
import { FOLDER_DWELL, confirmedFolderDrop } from "./folder-drop"

type Point = { x: number; y: number }
type Bounds = { left: number; top: number; width: number; height: number }
type DragSession = {
  columns: number
  item: GridItem
  width: number
  height: number
  origin: GridPosition
  grabOffset: Point
  pointerOrigin: Point
  mouse: boolean
  positions: GridPositions
  sourceFolderId?: string
  sourceSurface?: "preview" | "dialog"
  dialogBounds?: Bounds
  dialogExited: boolean
}
type Intent =
  | { kind: "none" }
  | { kind: "grid"; position: GridPosition; holdLayout: boolean }
  | { kind: "folder"; folderId: string; ready: boolean }
  | { kind: "reorder"; folderId: string; index: number }

function contains(point: Point, rect: Bounds, insetX = 0, insetY = 0) {
  return (
    point.x >= rect.left + rect.width * insetX &&
    point.x <= rect.left + rect.width * (1 - insetX) &&
    point.y >= rect.top + rect.height * insetY &&
    point.y <= rect.top + rect.height * (1 - insetY)
  )
}

export default function TabGrid() {
  const selecting = useGridSelectionStore((state) => state.active)
  const selectedIds = useGridSelectionStore((state) => state.ids)
  const toggleSelection = useGridSelectionStore((state) => state.toggle)
  const items = useTabGridStore((state) => state.items)
  const layouts = useTabGridStore((state) => state.layouts)
  const setLayout = useTabGridStore((state) => state.setLayout)
  const ensureLayout = useTabGridStore((state) => state.ensureLayout)
  const transferTab = useTabGridStore((state) => state.transferTab)
  const gridRef = useRef<HTMLDivElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<Point | null>(null)
  const [width, setWidth] = useState(0)
  const [editor, setEditor] = useState<{ item?: GridItem } | null>(null)
  const [folderId, setFolderId] = useState<string | null>(null)
  const [dragging, setDragging] = useState<DragSession | null>(null)
  const sessionRef = useRef<DragSession | null>(null)
  const [intent, setIntent] = useState<Intent>({ kind: "none" })
  const intentRef = useRef<Intent>({ kind: "none" })
  const hover = useRef<{
    folderId: string
    anchor: Point
    startedAt: number
    ready: boolean
    timer: ReturnType<typeof setTimeout>
  } | null>(null)
  const [dialogSuspended, setDialogSuspended] = useState(false)
  const [heldLayout, setHeldLayout] = useState<GridPositions | null>(null)
  const columns = dragging?.columns ?? columnsForWidth(width)
  const columnStep = (width + 12) / columns
  const positions =
    heldLayout ?? dragging?.positions ?? layouts[columns] ?? emptyPositions
  const gridTarget =
    dragging && intent.kind === "grid"
      ? { id: dragging.item.id, position: intent.position }
      : undefined
  const previewItems =
    dragging?.sourceFolderId && gridTarget ? [...items, dragging.item] : items
  const placements = placeItems(
    previewItems,
    columns,
    positions,
    intent.kind === "grid" && !intent.holdLayout ? gridTarget : undefined
  )

  useEffect(() => {
    if (width > 0 && !dragging) ensureLayout(columns)
  }, [columns, width, items, layouts, dragging, ensureLayout])

  useLayoutEffect(() => {
    const element = gridRef.current
    if (!element) return
    const viewport = scrollRef.current
    function updateFade() {
      if (!viewport) return
      const remaining = Math.max(
        0,
        viewport.scrollHeight - viewport.clientHeight - viewport.scrollTop
      )
      viewport.style.setProperty(
        "--grid-fade-top",
        `${Math.min(24, Math.max(0, viewport.scrollTop))}px`
      )
      viewport.style.setProperty(
        "--grid-fade-bottom",
        `${Math.min(24, remaining)}px`
      )
    }
    const observer = new ResizeObserver(() => {
      setWidth(element!.getBoundingClientRect().width)
      updateFade()
    })
    const trackPointer = (event: MouseEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    observer.observe(element)
    if (viewport) observer.observe(viewport)
    viewport?.addEventListener("scroll", updateFade, { passive: true })
    updateFade()
    document.addEventListener("mousemove", trackPointer, { passive: true })
    return () => {
      observer.disconnect()
      viewport?.removeEventListener("scroll", updateFade)
      document.removeEventListener("mousemove", trackPointer)
      if (hover.current) clearTimeout(hover.current.timer)
    }
  }, [])

  const keyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { currentCoordinates }
  ) => {
    const delta = {
      ArrowLeft: [-columnStep, 0],
      ArrowRight: [columnStep, 0],
      ArrowUp: [0, -ROW_STEP],
      ArrowDown: [0, ROW_STEP],
    }[event.code]
    if (!delta) return undefined
    event.preventDefault()
    return {
      x: currentCoordinates.x + delta[0],
      y: currentCoordinates.y + delta[1],
    }
  }
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates })
  )

  function publish(next: Intent) {
    intentRef.current = next
    setIntent((previous) =>
      JSON.stringify(previous) === JSON.stringify(next) ? previous : next
    )
  }
  function clearHover() {
    if (hover.current) clearTimeout(hover.current.timer)
    hover.current = null
    setHeldLayout(null)
  }
  function resetDrag() {
    clearHover()
    sessionRef.current = null
    setDragging(null)
    publish({ kind: "none" })
    setDialogSuspended(false)
  }
  function startDrag(event: DragStartEvent) {
    clearHover()
    const data = event.active.data.current as FolderTabDragData | undefined
    let item: GridItem | undefined
    let element: Element | null | undefined
    let sourceFolderId: string | undefined
    if (data?.type === "folder-tab") {
      const folder = items.find((item) => item.id === data.folderId)
      const tab =
        folder?.kind === "folder"
          ? folder.tabs.find((tab) => tab.id === data.tabId)
          : undefined
      if (!tab || folder?.kind !== "folder") return
      item = {
        ...tab,
        kind: "tab",
        size: tab.size ?? "small",
        color: tab.color ?? folder.color,
      } as TabItem
      sourceFolderId = folder.id
      element = data.getElement()
    } else {
      item = items.find((item) => item.id === event.active.id)
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
      origin: placements[sourceFolderId ?? item.id],
      grabOffset: { x: point.x - rect.left, y: point.y - rect.top },
      pointerOrigin: point,
      mouse,
      positions: Object.fromEntries(
        Object.entries(placements).map(([id, { x, y }]) => [id, { x, y }])
      ),
      sourceFolderId,
      sourceSurface: data?.type === "folder-tab" ? data.surface : undefined,
      dialogBounds: element
        ?.closest("[data-expanded-folder]")
        ?.getBoundingClientRect(),
      dialogExited: false,
    }
    sessionRef.current = session
    setDragging(session)
  }
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
      if (row.dataset.tabId === session.item.id || row.inert) continue
      const rect = row.getBoundingClientRect()
      if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue
      if (point.y < rect.top + rect.height / 2)
        return Math.max(
          0,
          remaining.findIndex((tab) => tab.id === row.dataset.tabId)
        )
    }
    const visible = rows.filter(
      (row) =>
        !row.inert &&
        row.dataset.tabId !== session.item.id &&
        row.getBoundingClientRect().top < viewport.bottom
    )
    const last = visible.at(-1)
    return last
      ? remaining.findIndex((tab) => tab.id === last.dataset.tabId) + 1
      : remaining.length
  }
  function updateIntent(delta: Point) {
    const session = sessionRef.current
    const grid = gridRef.current?.getBoundingClientRect()
    if (!session || !grid) return
    const point =
      session.mouse && pointer.current
        ? pointer.current
        : {
            x: session.pointerOrigin.x + delta.x,
            y: session.pointerOrigin.y + delta.y,
          }
    if (session.dialogBounds && !session.dialogExited) {
      if (contains(point, session.dialogBounds)) {
        clearHover()
        publish({
          kind: "reorder",
          folderId: session.sourceFolderId!,
          index: insertionIndex(session.sourceFolderId!, point, session),
        })
        return
      }
      session.dialogExited = true
      setDialogSuspended(true)
    }
    if (session.sourceFolderId) {
      const sourceBounds = folderBounds(session.sourceFolderId)
      if (sourceBounds && contains(point, sourceBounds)) {
        clearHover()
        publish({
          kind: "reorder",
          folderId: session.sourceFolderId,
          index: insertionIndex(session.sourceFolderId, point, session),
        })
        return
      }
    }
    const latched = hover.current
    if (latched?.ready) {
      const bounds = folderBounds(latched.folderId)
      if (confirmedFolderDrop(latched, point, bounds, performance.now())) {
        publish({ kind: "folder", folderId: latched.folderId, ready: true })
        return
      }
      clearHover()
    }
    let overlapsFolder = false
    if (session.item.kind === "tab") {
      for (const folder of items) {
        if (folder.kind !== "folder" || folder.id === session.sourceFolderId)
          continue
        const rect = folderBounds(folder.id)
        if (!rect || !contains(point, rect)) continue
        overlapsFolder = true
        if (!contains(point, rect, 0.22, 0.18)) continue
        if (
          hover.current?.folderId !== folder.id ||
          (!hover.current.ready &&
            Math.hypot(
              point.x - hover.current.anchor.x,
              point.y - hover.current.anchor.y
            ) > 12)
        ) {
          clearHover()
          setHeldLayout(
            Object.fromEntries(
              items.map((item) => [
                item.id,
                { x: placements[item.id].x, y: placements[item.id].y },
              ])
            )
          )
          const candidate = {
            folderId: folder.id,
            anchor: point,
            startedAt: performance.now(),
            ready: false,
            timer: setTimeout(() => {
              if (
                sessionRef.current !== session ||
                hover.current?.folderId !== folder.id
              )
                return
              const liveBounds = folderBounds(folder.id)
              if (
                !liveBounds ||
                !contains(
                  session.mouse ? (pointer.current ?? point) : point,
                  liveBounds,
                  0.22,
                  0.18
                )
              )
                return
              hover.current.ready = true
              publish({ kind: "folder", folderId: folder.id, ready: true })
            }, FOLDER_DWELL),
          }
          hover.current = candidate
        }
        publish({
          kind: "folder",
          folderId: folder.id,
          ready: hover.current!.ready,
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
      publish({ kind: "none" })
      return
    }
    const position = {
      x: Math.max(
        0,
        Math.min(
          columns - 4,
          Math.round((point.x - session.grabOffset.x - grid.left) / columnStep)
        )
      ),
      y: Math.max(
        0,
        Math.min(
          500,
          Math.round((point.y - session.grabOffset.y - grid.top) / ROW_STEP)
        )
      ),
    }
    publish({ kind: "grid", position, holdLayout: overlapsFolder })
  }
  function finishDrag(event: DragEndEvent) {
    const session = sessionRef.current
    if (!session) {
      resetDrag()
      return
    }
    const releasePoint =
      session.mouse && pointer.current
        ? pointer.current
        : {
            x: session.pointerOrigin.x + event.delta.x,
            y: session.pointerOrigin.y + event.delta.y,
          }
    const candidate = hover.current
    const confirmed = confirmedFolderDrop(
      candidate,
      releasePoint,
      candidate ? folderBounds(candidate.folderId) : null,
      performance.now()
    )
    if (confirmed) publish({ kind: "folder", folderId: confirmed, ready: true })
    else updateIntent(event.delta)
    let action = intentRef.current
    const grid = gridRef.current?.getBoundingClientRect()
    if (session && grid && action.kind === "folder" && !action.ready) {
      const point =
        session.mouse && pointer.current
          ? pointer.current
          : {
              x: session.pointerOrigin.x + event.delta.x,
              y: session.pointerOrigin.y + event.delta.y,
            }
      action = {
        kind: "grid",
        holdLayout: true,
        position: {
          x: Math.max(
            0,
            Math.min(
              columns - 4,
              Math.round(
                (point.x - session.grabOffset.x - grid.left) / columnStep
              )
            )
          ),
          y: Math.max(
            0,
            Math.min(
              500,
              Math.round((point.y - session.grabOffset.y - grid.top) / ROW_STEP)
            )
          ),
        },
      }
    }
    let committed = false
    if (session) {
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
      } else if (action.kind === "grid") {
        if (session.sourceFolderId)
          transferTab({
            tabId: session.item.id,
            fromFolderId: session.sourceFolderId,
            columns,
            position: action.position,
          })
        else {
          const next = placeItems(items, columns, session.positions, {
            id: session.item.id,
            position: action.position,
          })
          setLayout(
            columns,
            Object.fromEntries(
              Object.entries(next).map(([id, { x, y }]) => [id, { x, y }])
            )
          )
        }
        committed = true
      }
      if (committed && session.dialogExited) setFolderId(null)
    }
    resetDrag()
  }
  const intentText =
    intent.kind === "folder"
      ? intent.ready
        ? "松手放入文件夹"
        : "继续停留，等待确认"
      : intent.kind === "reorder"
        ? "松开调整文件夹内顺序"
        : intent.kind === "grid" && dragging?.sourceFolderId
          ? "松开放到主页"
          : ""

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<section />}
        data-tour="grid"
        aria-label="标签网格"
        className="mx-auto mt-6 min-h-0 w-full max-w-[1340px] flex-1"
      >
        <DndContext
          sensors={sensors}
          onDragStart={startDrag}
          onDragMove={(event: DragMoveEvent) => updateIntent(event.delta)}
          onDragEnd={finishDrag}
          onDragCancel={resetDrag}
        >
          <div
            ref={scrollRef}
            tabIndex={0}
            aria-label="滚动标签网格"
            className={`h-full min-h-0 [scrollbar-width:none] overflow-x-hidden overflow-y-auto overscroll-contain ${selecting ? "pb-28" : "pb-4"} outline-none [overflow-anchor:none] [&::-webkit-scrollbar]:hidden`}
            style={{
              margin: "-20px -20px 0",
              paddingTop: 20,
              paddingLeft: 20,
              paddingRight: 20,
              height: "calc(100% + 20px)",
              maskImage:
                "linear-gradient(to bottom, transparent, black var(--grid-fade-top, 0px), black calc(100% - var(--grid-fade-bottom, 0px)), transparent)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent, black var(--grid-fade-top, 0px), black calc(100% - var(--grid-fade-bottom, 0px)), transparent)",
            }}
          >
            <div
              ref={gridRef}
              className="relative grid min-h-11 auto-rows-[44px] gap-3"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {(width > 0 && layouts[columns] ? items : []).map((item) =>
                selecting ? (
                  <div
                    key={item.id}
                    data-grid-item-id={item.id}
                    className="relative isolate min-w-0 rounded-2xl border transition-shadow duration-200 motion-reduce:transition-none"
                    style={{
                      boxShadow: selectedIds.includes(item.id)
                        ? `0 0 16px 2px color-mix(in srgb, ${item.color} 45%, transparent), 0 0 5px color-mix(in srgb, ${item.color} 65%, transparent)`
                        : undefined,
                      gridColumn: `${placements[item.id].x + 1} / span 4`,
                      gridRow: `${placements[item.id].y + 1} / span ${placements[item.id].height}`,
                    }}
                  >
                    <div
                      inert
                      className="pointer-events-none relative h-full overflow-hidden rounded-[inherit]"
                    >
                      <GridTileContent
                        item={{
                          ...item,
                          dynamicEffect: selectedIds.includes(item.id),
                        }}
                        onOpen={() => {}}
                        preview
                      />
                    </div>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={selectedIds.includes(item.id)}
                      aria-label={`选择${item.name}`}
                      className="absolute inset-0 z-30 cursor-pointer appearance-none rounded-[inherit] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => toggleSelection(item.id)}
                    />
                  </div>
                ) : (
                  <DraggableGridItem
                    key={item.id}
                    item={item}
                    placement={
                      !dragging?.sourceFolderId && dragging?.item.id === item.id
                        ? { ...dragging.origin, height: itemHeight(item) }
                        : placements[item.id]
                    }
                    dropState={
                      intent.kind === "folder" && intent.folderId === item.id
                        ? intent.ready
                          ? "ready"
                          : "pending"
                        : undefined
                    }
                    onOpen={() => setFolderId(item.id)}
                    onEdit={() => setEditor({ item })}
                  />
                )
              )}
              {dragging && intent.kind === "grid" && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5 transition-transform duration-200 ease-out motion-reduce:transition-none"
                  style={{
                    width: columnStep * 4 - 12,
                    height: itemHeight(dragging.item) * ROW_STEP - 12,
                    transform: `translate3d(${intent.position.x * columnStep}px, ${intent.position.y * ROW_STEP}px, 0)`,
                  }}
                />
              )}
            </div>
          </div>
          {createPortal(
            <DragOverlay
              zIndex={1000}
              dropAnimation={
                dragging?.sourceFolderId ||
                intent.kind === "folder" ||
                window.matchMedia("(prefers-reduced-motion: reduce)").matches
                  ? null
                  : {
                      duration: 240,
                      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                      sideEffects: defaultDropAnimationSideEffects({
                        styles: { active: { opacity: "0" } },
                      }),
                    }
              }
            >
              {dragging && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none relative isolate cursor-grabbing rounded-2xl border shadow-lg"
                  style={{ width: dragging.width, height: dragging.height }}
                >
                  <GridTileContent
                    item={dragging.item}
                    onOpen={() => {}}
                    preview
                  />
                  {intentText && (
                    <span className="absolute top-full left-1/2 mt-2 -translate-x-1/2 rounded-lg bg-primary px-3 py-1 text-xs whitespace-nowrap text-primary-foreground">
                      {intentText}
                    </span>
                  )}
                </div>
              )}
            </DragOverlay>,
            document.body
          )}
          <span role="status" className="sr-only">
            {intentText}
          </span>
          {editor && (
            <GridItemDialog
              item={editor.item}
              onClose={() => setEditor(null)}
            />
          )}
          {folderId && (
            <FolderExpansion
              folderId={folderId}
              suspended={dialogSuspended}
              onClose={() => setFolderId(null)}
            />
          )}
          <BulkActions />
        </DndContext>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem onClick={() => setEditor({})}>
          <Plus />
          添加组件
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
