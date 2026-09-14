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
import CollectionExpansion from "./collection/expansion"
import { getComponentDefinition } from "./model/registry"
import {
  itemHeight,
  itemWidth,
  placeItems,
  type GridPosition,
  type GridPositions,
} from "./grid-layout"
import type { GridItem, TabEntry, TabItem } from "./types"
import type { FolderTabDragData } from "./drag-types"
import {
  confirmedFolderDrop,
  draggedBounds,
  FOLDER_CHARGE_DURATION,
  FOLDER_RELEASE_DURATION,
  mixHexColor,
  overlapRatio,
} from "./folder-drop"

const emptyPositions: GridPositions = {}

const FOLDER_GAP_ID = "__folder-gap__"

function previewFolderTabs(
  tabs: TabEntry[],
  tabId: string | undefined,
  index: number
) {
  if (!tabId) return tabs
  const remaining = tabs.filter((tab) => tab.id !== tabId)
  const next = [...remaining]
  next.splice(Math.max(0, Math.min(index, next.length)), 0, {
    id: FOLDER_GAP_ID,
    name: "",
    url: "",
  })
  return next
}

function ItemGlow({
  color,
  opacity = 0.22,
}: {
  color: string
  opacity?: number
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{
        background: color,
        opacity,
        filter: "blur(12px)",
      }}
    />
  )
}

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
  sourceFolderColor?: string
  sourceSurface?: "preview" | "dialog"
  dialogBounds?: Bounds
  dialogExited: boolean
}
type Intent =
  | { kind: "none" }
  | {
      kind: "grid"
      position: GridPosition
      holdLayout: boolean
      releaseProgress: number
      ready: boolean
    }
  | {
      kind: "folder"
      folderId: string
      ready: boolean
      progress: number
      color: string
    }
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
    startedAt: number
    frame: number
  } | null>(null)
  const release = useRef<{ startedAt: number; frame: number } | null>(null)
  const [dialogSuspended, setDialogSuspended] = useState(false)
  const [heldLayout, setHeldLayout] = useState<GridPositions | null>(null)
  const columns = dragging?.columns ?? columnsForWidth(width)
  const compactGrid = width > 0 && width < 640
  const gridGap = compactGrid ? 12 : 16
  const columnStep = (width + gridGap) / columns
  const rowStep = columnStep
  const positions =
    heldLayout ?? dragging?.positions ?? layouts[columns] ?? emptyPositions
  const gridTarget =
    dragging && intent.kind === "grid"
      ? { id: dragging.item.id, position: intent.position }
      : undefined
  const [settledTarget, setSettledTarget] = useState<
    | {
        id: string
        position: { x: number; y: number }
      }
    | undefined
  >(undefined)
  const targetId = gridTarget?.id
  const targetX = gridTarget?.position.x
  const targetY = gridTarget?.position.y
  const holdPreview =
    intent.kind !== "grid" || !!intent.holdLayout || !intent.ready
  useEffect(() => {
    if (
      !targetId ||
      targetX === undefined ||
      targetY === undefined ||
      holdPreview
    ) {
      const timer = setTimeout(() => setSettledTarget(undefined), 0)
      return () => clearTimeout(timer)
    }
    const timer = setTimeout(() => {
      setSettledTarget({ id: targetId, position: { x: targetX, y: targetY } })
    }, 120)
    return () => clearTimeout(timer)
  }, [targetId, targetX, targetY, holdPreview])
  const previewItems =
    dragging?.sourceFolderId && gridTarget ? [...items, dragging.item] : items
  const placements = placeItems(
    previewItems,
    columns,
    positions,
    dragging && intent.kind === "grid" && !intent.holdLayout
      ? settledTarget
      : undefined
  )

  useEffect(() => {
    if (width > 0 && !dragging) ensureLayout(columns)
  }, [columns, width, items, layouts, dragging, ensureLayout])

  useLayoutEffect(() => {
    const element = gridRef.current
    if (!element) return
    const observer = new ResizeObserver(() => {
      setWidth(element!.getBoundingClientRect().width)
    })
    const trackPointer = (event: MouseEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY }
    }
    observer.observe(element)
    document.addEventListener("mousemove", trackPointer, { passive: true })
    return () => {
      if (hover.current) cancelAnimationFrame(hover.current.frame)
      observer.disconnect()
      document.removeEventListener("mousemove", trackPointer)
    }
  }, [])

  const keyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { currentCoordinates }
  ) => {
    const delta = {
      ArrowLeft: [-columnStep, 0],
      ArrowRight: [columnStep, 0],
      ArrowUp: [0, -rowStep],
      ArrowDown: [0, rowStep],
    }[event.code]
    if (!delta) return undefined
    event.preventDefault()
    return {
      x: currentCoordinates.x + delta[0],
      y: currentCoordinates.y + delta[1],
    }
  }
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates })
  )

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
  function startDrag(event: DragStartEvent) {
    clearHover()
    const data = event.active.data.current as FolderTabDragData | undefined
    let item: GridItem | undefined
    let element: Element | null | undefined
    let sourceFolderId: string | undefined
    let sourceFolderColor: string | undefined
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
      sourceFolderColor = folder.color
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
      sourceFolderColor,
      sourceSurface: data?.type === "folder-tab" ? data.surface : undefined,
      dialogBounds: element
        ?.closest("[data-expanded-collection]")
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
        clearRelease()
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
        clearRelease()
        publish({
          kind: "reorder",
          folderId: session.sourceFolderId,
          index: insertionIndex(session.sourceFolderId, point, session),
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
        if (!confirmedFolderDrop(ratio)) continue
        if (!best || ratio > best.ratio)
          best = { folderId: folder.id, color: folder.color, ratio }
      }
      if (best) {
        clearRelease()
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
        publish({
          kind: "folder",
          folderId: best.folderId,
          ready,
          progress,
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
    const position = {
      x: Math.max(
        0,
        Math.min(
          columns - itemWidth(session.item, columns),
          Math.round((point.x - session.grabOffset.x - grid.left) / columnStep)
        )
      ),
      y: Math.max(
        0,
        Math.min(
          500,
          Math.round((point.y - session.grabOffset.y - grid.top) / rowStep)
        )
      ),
    }
    if (session.sourceFolderId) {
      if (!release.current)
        release.current = { startedAt: performance.now(), frame: 0 }
      const progress = Math.min(
        1,
        (performance.now() - release.current.startedAt) /
          FOLDER_RELEASE_DURATION
      )
      const ready = progress >= 1
      cancelAnimationFrame(release.current.frame)
      if (!ready)
        release.current.frame = requestAnimationFrame(() => updateIntent(delta))
      publish({
        kind: "grid",
        position,
        holdLayout: false,
        releaseProgress: progress,
        ready,
      })
      return
    }
    clearRelease()
    publish({
      kind: "grid",
      position,
      holdLayout: false,
      releaseProgress: 1,
      ready: true,
    })
  }
  function finishDrag(event: DragEndEvent) {
    const session = sessionRef.current
    if (!session) {
      resetDrag()
      return
    }
    updateIntent(event.delta)
    let action = intentRef.current
    if (action.kind === "folder" && !action.ready) {
      const source = sessionRef.current
      const grid = gridRef.current?.getBoundingClientRect()
      const point =
        source?.mouse && pointer.current
          ? pointer.current
          : {
              x: (source?.pointerOrigin.x ?? 0) + event.delta.x,
              y: (source?.pointerOrigin.y ?? 0) + event.delta.y,
            }
      action =
        source && grid
          ? {
              kind: "grid",
              holdLayout: true,
              releaseProgress: 1,
              ready: true,
              position: {
                x: Math.max(
                  0,
                  Math.min(
                    columns - itemWidth(source.item, columns),
                    Math.round(
                      (point.x - source.grabOffset.x - grid.left) / columnStep
                    )
                  )
                ),
                y: Math.max(
                  0,
                  Math.min(
                    500,
                    Math.round(
                      (point.y - source.grabOffset.y - grid.top) / rowStep
                    )
                  )
                ),
              },
            }
          : { kind: "none" }
    }
    if (action.kind === "grid" && session.sourceFolderId && !action.ready)
      action = { kind: "none" }
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
      } else if (action.kind === "grid" && action.ready) {
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
  const releaseProgress =
    dragging?.sourceFolderId && intent.kind === "grid"
      ? intent.releaseProgress
      : dragging?.sourceFolderId
        ? 0
        : 1
  const overlayItem = !dragging
    ? undefined
    : dragging.sourceFolderId &&
        dragging.sourceFolderColor &&
        dragging.item.kind === "tab"
      ? {
          ...dragging.item,
          color: mixHexColor(
            dragging.sourceFolderColor,
            dragging.item.color,
            releaseProgress
          ),
        }
      : dragging && intent.kind === "folder" && dragging.item.kind === "tab"
        ? {
            ...dragging.item,
            color: mixHexColor(
              dragging.item.color,
              intent.color,
              intent.progress
            ),
          }
        : dragging.item
  const overlayWidth =
    dragging && dragging.sourceFolderId
      ? dragging.width +
        (columnStep * itemWidth(dragging.item, columns) -
          gridGap -
          dragging.width) *
          releaseProgress
      : dragging?.width
  const overlayHeight =
    dragging && dragging.sourceFolderId
      ? dragging.height +
        (itemHeight(dragging.item) * rowStep - gridGap - dragging.height) *
          releaseProgress
      : dragging?.height

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<section />}
        data-tour="grid"
        aria-label="标签网格"
        className="mx-auto min-h-0 w-full max-w-[1280px]"
      >
        <DndContext
          sensors={sensors}
          onDragStart={startDrag}
          onDragMove={(event: DragMoveEvent) => updateIntent(event.delta)}
          onDragEnd={finishDrag}
          onDragCancel={resetDrag}
        >
          <div
            className={`${selecting ? "pb-28" : "pb-4"} px-5`}
            style={{
              margin: "0 -20px",
              paddingTop: compactGrid ? 12 : 20,
            }}
          >
            <div
              ref={gridRef}
              className={`relative grid min-h-11 ${compactGrid ? "gap-3" : "gap-4"}`}
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
                gridAutoRows: Math.max(1, rowStep - gridGap),
              }}
            >
              {(width > 0 && layouts[columns] ? items : []).map((item) =>
                selecting ? (
                  <div
                    key={item.id}
                    data-grid-item-id={item.id}
                    className={`relative isolate min-w-0 rounded-2xl ${getComponentDefinition(item.kind).tileBorder ? "border" : ""}`}
                    style={{
                      gridColumn: `${placements[item.id].x + 1} / span ${itemWidth(item, columns)}`,
                      gridRow: `${placements[item.id].y + 1} / span ${placements[item.id].height}`,
                    }}
                  >
                    {selectedIds.includes(item.id) && (
                      <ItemGlow color={item.color} />
                    )}
                    <div
                      inert
                      className="pointer-events-none relative z-10 h-full overflow-hidden rounded-[inherit]"
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
                        ? {
                            ...dragging.origin,
                            height: itemHeight(item),
                            width: itemWidth(item, columns),
                          }
                        : placements[item.id]
                    }
                    dropProgress={
                      intent.kind === "folder" && intent.folderId === item.id
                        ? intent.progress
                        : undefined
                    }
                    folderTabs={
                      item.kind === "folder" &&
                      intent.kind === "reorder" &&
                      intent.folderId === item.id
                        ? previewFolderTabs(
                            item.tabs,
                            dragging?.item.id,
                            intent.index
                          )
                        : undefined
                    }
                    onOpen={() => {
                      const action = getComponentDefinition(
                        item.kind
                      ).openAction
                      if (action === "edit") setEditor({ item })
                      if (action === "expand") setFolderId(item.id)
                    }}
                    onEdit={() => setEditor({ item })}
                  />
                )
              )}
              {dragging && intent.kind === "grid" && intent.ready && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 transition-transform duration-150 ease-out motion-reduce:transition-none"
                  style={{
                    width:
                      columnStep * itemWidth(dragging.item, columns) - gridGap,
                    height: itemHeight(dragging.item) * rowStep - gridGap,
                    transform: `translate3d(${(settledTarget ? placements[dragging.item.id].x : intent.position.x) * columnStep}px, ${(settledTarget ? placements[dragging.item.id].y : intent.position.y) * rowStep}px, 0)`,
                  }}
                >
                  <ItemGlow color={dragging.item.color} />
                </div>
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
                      duration: 280,
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
                  className="pointer-events-none relative cursor-grabbing"
                  style={{ width: overlayWidth, height: overlayHeight }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 rounded-2xl"
                    style={{
                      background: overlayItem?.color ?? dragging.item.color,
                      opacity: 0.45,
                      filter: "blur(16px)",
                    }}
                  />
                  <div
                    className="relative isolate h-full overflow-hidden rounded-2xl"
                    style={{
                      boxShadow:
                        releaseProgress > 0
                          ? `0 10px 15px -3px rgb(0 0 0 / ${0.1 * releaseProgress}), 0 4px 6px -4px rgb(0 0 0 / ${0.1 * releaseProgress})`
                          : undefined,
                      borderWidth: releaseProgress > 0 ? 1 : 0,
                      borderStyle: "solid",
                      borderColor: `color-mix(in srgb, var(--border) ${releaseProgress * 100}%, transparent)`,
                    }}
                  >
                    <GridTileContent
                      item={overlayItem ?? dragging.item}
                      onOpen={() => {}}
                      preview
                      compactTab={
                        !!dragging.sourceFolderId && releaseProgress < 1
                      }
                    />
                  </div>
                </div>
              )}
            </DragOverlay>,
            document.body
          )}
          {editor && (
            <GridItemDialog
              item={editor.item}
              onClose={() => setEditor(null)}
            />
          )}
          {folderId && (
            <CollectionExpansion
              itemId={folderId}
              suspended={dialogSuspended}
              onClose={() => setFolderId(null)}
              folderTabs={
                intent.kind === "reorder" && intent.folderId === folderId
                  ? previewFolderTabs(
                      items.find(
                        (item): item is Extract<GridItem, { kind: "folder" }> =>
                          item.id === folderId && item.kind === "folder"
                      )?.tabs ?? [],
                      dragging?.item.id,
                      intent.index
                    )
                  : undefined
              }
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
