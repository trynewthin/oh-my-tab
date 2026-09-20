import { useGridSelectionStore } from "@/stores/grid-selection-store"
import BulkActions from "./bulk-actions"
import { Plus } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"
import {
  findVacancy,
  gridMetrics,
  gridOccupancyBox,
  itemHeight,
  itemWidth,
  placeItems,
  positionsOnly,
  type GridPlacement,
  type GridPositions,
} from "@/lib/grid/grid-layout"
import { useEffect, useRef, useState } from "react"
import {
  DndContext,
  MouseSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core"
import { useTabGridStore } from "@/stores/tab-grid-store"
import DraggableGridItem from "./draggable-grid-item"
import GridTileContent from "./grid-tile-content"
import GridItemDialog from "./grid-item-dialog"
import CollectionExpansion from "./collection/expansion"
import { getComponentDefinition } from "@/lib/grid/registry"
import type { GridItem } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"
import { ItemGlow } from "./grid-dnd-overlay"
import { useGridDrag } from "./use-grid-drag"
import GridDragOverlay from "./drag/grid-drag-overlay"
import useGridMeasurement from "./use-grid-measurement"
import { previewFolderTabs, previewTodoTasks } from "./drag/model"
import type { GridPosition } from "@/lib/grid/grid-layout"

const emptyPositions: GridPositions = {}


// Preview drops resolve by re-homing overlapped tiles into freed cells, and
// when that cannot fit the fixed area, by reflowing every tile in reading
// order. A drop that still overflows is rejected — the caller keeps the
// settled layout so tiles spring back instead of clipping out of view.
function resolvePreviewDrop(
  items: GridItem[],
  columns: number,
  rows: number | undefined,
  positions: GridPositions,
  target: { id: string; position: GridPosition }
): GridPositions | null {
  const item = items.find((entry) => entry.id === target.id)
  if (!item) return null
  const width = itemWidth(item, columns)
  const height = itemHeight(item)
  const targetPlacement: GridPlacement = {
    x: Math.max(0, Math.min(columns - width, Math.round(target.position.x))),
    y: Math.max(
      0,
      Math.min(
        Math.max(0, (rows ?? height) - height),
        Math.round(target.position.y)
      )
    ),
    width,
    height,
  }
  const ordered = items
    .filter((entry) => positions[entry.id])
    .sort(
      (a, b) =>
        positions[a.id].y - positions[b.id].y ||
        positions[a.id].x - positions[b.id].x
    )
  const placementOf = (entry: GridItem): GridPlacement => ({
    ...(positions[entry.id] ?? { x: 0, y: 0 }),
    width: itemWidth(entry, columns),
    height: itemHeight(entry),
  })
  const displaced = ordered.filter(
    (entry) =>
      entry.id !== item.id &&
      placementsOverlap(targetPlacement, placementOf(entry))
  )
  const next: Record<string, GridPlacement> = { [item.id]: targetPlacement }
  for (const entry of ordered) {
    if (entry.id === item.id || displaced.includes(entry)) continue
    next[entry.id] = placementOf(entry)
  }
  const fits = (p: GridPlacement) =>
    rows === undefined || (p.y + p.height <= rows && p.x + p.width <= columns)
  let passOk = true
  for (const entry of displaced) {
    const free = findVacancy(
      Object.values(next),
      columns,
      itemHeight(entry),
      itemWidth(entry, columns)
    )
    if (!fits(free)) {
      passOk = false
      break
    }
    next[entry.id] = free
  }
  if (passOk) return positionsOnly(next)

  const reflowed: Record<string, GridPlacement> = {
    [item.id]: targetPlacement,
  }
  for (const entry of ordered) {
    if (entry.id === item.id) continue
    const free = findVacancy(
      Object.values(reflowed),
      columns,
      itemHeight(entry),
      itemWidth(entry, columns)
    )
    if (!fits(free)) return null
    reflowed[entry.id] = free
  }
  return positionsOnly(reflowed)
}

function placementsOverlap(a: GridPlacement, b: GridPlacement) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export default function TabGrid({
  preview = false,
  items: itemsOverride,
  trackWidth,
  area,
  previewPositions,
  fullViewport = false,
}: {
  preview?: boolean
  items?: GridItem[]
  trackWidth?: number
  area?: { columns: number; rows: number }
  previewPositions?: GridPositions
  fullViewport?: boolean
} = {}) {
  const selecting = useGridSelectionStore((state) => state.active) && !preview
  const { t } = useTranslation()
  const selectedIds = useGridSelectionStore((state) => state.ids)
  const toggleSelection = useGridSelectionStore((state) => state.toggle)
  const storeItems = useTabGridStore((state) => state.items)
  const items = itemsOverride ?? storeItems
  const layouts = useTabGridStore((state) => state.layouts)
  const ensureLayout = useTabGridStore((state) => state.ensureLayout)
  const gridRef = useRef<HTMLDivElement>(null)
  const { pointer, measuredWidth } = useGridMeasurement({
    gridRef,
    trackWidth,
  })
  const sourceWidth = trackWidth ?? measuredWidth
  const metrics = gridMetrics(
    sourceWidth,
    fullViewport ? "even-components" : "standard"
  )
  const box = area
    ? gridOccupancyBox(sourceWidth, area.columns, area.rows)
    : null
  const width = box?.width ?? measuredWidth
  const [editor, setEditor] = useState<{ item?: GridItem } | null>(null)
  const [folderId, setFolderId] = useState<string | null>(null)
  const widthColumns = area?.columns ?? metrics.columns
  const compactGrid = metrics.compact
  const gridGap = metrics.gap
  const [settledTarget, setSettledTarget] = useState<
    | {
        id: string
        position: { x: number; y: number }
      }
    | undefined
  >(undefined)

  // Preview grids keep their placements in local state; the live grid reads
  // them from the store layouts. Both feed the same drag hook below.
  const [previewPlaced, setPreviewPlaced] = useState<GridPositions>(
    () => previewPositions ?? emptyPositions
  )
  const [previewSeed, setPreviewSeed] = useState(previewPositions)
  if (previewSeed !== previewPositions) {
    setPreviewSeed(previewPositions)
    setPreviewPlaced(previewPositions ?? emptyPositions)
  }

  // The hook owns the drag session and freezes the column count into it at
  // startDrag time. startDrag only ever runs while not dragging, so it reads
  // the base placements derived from the stored layout — never the live,
  // intent-driven preview. resolvePlacements closes that over lazily.
  const drag = useGridDrag({
    items,
    widthColumns,
    width,
    gridGap,
    gridRef,
    pointer,
    closeFolder: () => setFolderId(null),
    resolvePlacements: (columns) =>
      placeItems(
        items,
        columns,
        preview ? previewPlaced : (layouts[columns] ?? emptyPositions)
      ),
    commitLayout: preview
      ? (_columns, next) => setPreviewPlaced(next)
      : undefined,
    resolveDrop: preview
      ? (positions, target) =>
          resolvePreviewDrop(items, widthColumns, area?.rows, positions, target)
      : undefined,
  })
  const {
    dragging,
    intent,
    heldLayout,
    dialogSuspended,
    startDrag,
    updateIntent,
    finishDrag,
    resetDrag,
  } = drag

  // The drag session freezes its own column count and positions snapshot, so
  // geometry must be recomputed against the session's columns while dragging.
  const columns = dragging?.columns ?? widthColumns
  const columnStep = metrics.columnStep
  const rowStep = metrics.rowStep

  const positions =
    heldLayout ??
    dragging?.positions ??
    (preview ? previewPlaced : layouts[columns]) ??
    emptyPositions
  const gridTarget =
    dragging && intent.kind === "grid"
      ? { id: dragging.item.id, position: intent.position }
      : undefined
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
  const liveTarget =
    dragging && intent.kind === "grid" && !intent.holdLayout
      ? settledTarget
      : undefined
  const placements = (() => {
    if (preview && liveTarget) {
      // The same two-pass resolution used for the drop commit drives the
      // in-flight preview, so what animates during a drag is what lands.
      const resolved = resolvePreviewDrop(
        items,
        columns,
        area?.rows,
        positions,
        liveTarget
      )
      if (resolved) return placeItems(items, columns, resolved)
      return placeItems(items, columns, positions)
    }
    return placeItems(
      previewItems,
      columns,
      positions,
      liveTarget,
      dragging?.sourceFolderId ? [dragging.sourceFolderId] : []
    )
  })()

  useEffect(() => {
    if (preview || width <= 0 || dragging) return
    ensureLayout(columns)
  }, [preview, columns, width, items, layouts, dragging, ensureLayout])


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

  const overlay = (
    <GridDragOverlay
      dragging={dragging}
      intent={intent}
      preview={preview}
      columns={columns}
      columnStep={columnStep}
      rowStep={rowStep}
      gridGap={gridGap}
    />
  )

  // The preview grid runs the same drag pipeline as the live grid — dnd-kit
  // sensors, the floating overlay, FLIP reflows — but tiles render without
  // context menus and drops commit to local state instead of the store.
  if (preview) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={startDrag}
        onDragMove={(event: DragMoveEvent) => updateIntent(event.delta)}
        onDragEnd={finishDrag}
        onDragCancel={resetDrag}
      >
        <div
          ref={gridRef}
          aria-label={t("grid.chrome.preview")}
          className={`relative grid min-h-11 overflow-hidden ${compactGrid ? "gap-3" : "gap-4"}`}
          style={{
            width: box?.width,
            height: box?.height,
            gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
            gridAutoRows: Math.max(1, rowStep - gridGap),
          }}
        >
          {items.map((item) => (
            <DraggableGridItem
              key={item.id}
              item={item}
              interactive={false}
              placement={
                placements[item.id] ?? {
                  x: 0,
                  y: 0,
                  width: itemWidth(item, columns),
                  height: itemHeight(item),
                }
              }
              onOpen={() => {}}
              onEdit={() => {}}
            />
          ))}
        </div>
        {overlay}
      </DndContext>
    )
  }

  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={<section />}
        data-tour="grid"
        aria-label={t("grid.chrome.grid")}
        className={`min-h-0 w-full ${fullViewport ? "" : "mx-auto max-w-[1280px]"}`}
      >
        <DndContext
          sensors={sensors}
          onDragStart={startDrag}
          onDragMove={(event: DragMoveEvent) => updateIntent(event.delta)}
          onDragEnd={finishDrag}
          onDragCancel={resetDrag}
        >
          <div
            className={`${selecting ? "pb-28" : "pb-4"} ${fullViewport ? "px-0" : "px-5"}`}
            style={{
              margin: fullViewport ? undefined : "0 -20px",
              paddingTop: compactGrid ? 12 : 20,
            }}
          >
            <div
              ref={gridRef}
              data-tab-grid-track={preview ? undefined : ""}
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
                    className={`relative isolate min-w-0 rounded-2xl ${getComponentDefinition(item.kind).tileBorder ? "border border-tile-border" : ""}`}
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
                      aria-label={t("grid.chrome.selectItem", {
                        name: item.name,
                      })}
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
                      item.kind !== "folder"
                        ? undefined
                        : intent.kind === "folder" &&
                            intent.folderId === item.id
                          ? previewFolderTabs(
                              item.tabs,
                              dragging?.item.id,
                              item.tabs.length
                            )
                          : intent.kind === "reorder" &&
                              intent.folderId === item.id
                            ? previewFolderTabs(
                                item.tabs,
                                dragging?.item.id,
                                intent.index
                              )
                            : dragging?.sourceFolderId === item.id &&
                                dragging.sourceFolderIndex !== undefined
                              ? previewFolderTabs(
                                  item.tabs,
                                  dragging.item.id,
                                  dragging.sourceFolderIndex
                                )
                              : undefined
                    }
                    todoTasks={
                      item.kind === "todo" &&
                      intent.kind === "todo-reorder" &&
                      intent.todoId === item.id
                        ? previewTodoTasks(
                            item.tasks,
                            dragging?.todoTask?.id,
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
            </div>
          </div>
          {overlay}
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
                  : dragging?.sourceFolderId === folderId &&
                      dragging.sourceFolderIndex !== undefined
                    ? previewFolderTabs(
                        items.find(
                          (
                            item
                          ): item is Extract<GridItem, { kind: "folder" }> =>
                            item.id === folderId && item.kind === "folder"
                        )?.tabs ?? [],
                        dragging.item.id,
                        dragging.sourceFolderIndex
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
          {t("grid.chrome.addComponent")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
