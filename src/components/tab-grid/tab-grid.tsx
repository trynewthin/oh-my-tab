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
  gridMetrics,
  gridOccupancyBox,
  itemHeight,
  itemWidth,
  placeItems,
  type GridPositions,
} from "@/lib/grid/grid-layout"
import { useEffect, useRef, useState } from "react"
import { DndContext, type DragMoveEvent } from "@dnd-kit/core"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useComponentsApplicationStore } from "@/stores/components-application-store"
import DraggableGridItem from "./draggable-grid-item"
import GridItemDialog from "./grid-item-dialog"
import CollectionExpansion from "./collection/expansion"
import FolderExpandedGrid from "./folder-expanded-grid"
import { componentLabel, getComponentDefinition } from "@/lib/grid/registry"
import type { GridItem } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"
import { useGridDrag } from "./use-grid-drag"
import GridDragOverlay from "./drag/grid-drag-overlay"
import useGridMeasurement from "./use-grid-measurement"
import GridSelectionItem from "./grid-selection-item"
import { resolvePreviewDrop } from "./preview-drop"
import useGridSensors from "./use-grid-sensors"
import { previewFolderTabs, previewTodoTasks } from "./drag/model"

const emptyPositions: GridPositions = {}

export default function TabGrid({
  preview = false,
  items: itemsOverride,
  trackWidth,
  area,
  previewPositions,
  previewScale = 1,
  fullViewport = false,
}: {
  preview?: boolean
  items?: GridItem[]
  trackWidth?: number
  area?: { columns: number; rows: number }
  previewPositions?: GridPositions
  previewScale?: number
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
  const liveBox = gridOccupancyBox(sourceWidth, metrics.columns, 1)
  const width = box?.width ?? (sourceWidth > 0 ? liveBox.width : measuredWidth)
  const [editor, setEditor] = useState<{ item?: GridItem } | null>(null)
  const [folderId, setFolderId] = useState<string | null>(null)
  const widthColumns = area?.columns ?? metrics.columns
  const compactGrid = metrics.compact
  const gridGap = metrics.gap
  const coordinateScale = preview ? previewScale : 1
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
    coordinateScale,
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
  const columnStep = metrics.columnStep * coordinateScale
  const rowStep = metrics.rowStep * coordinateScale

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

  // The expanded surface only exists while a folder with this id is present.
  const expandedFolder =
    folderId === null
      ? undefined
      : items.find(
          (item): item is Extract<GridItem, { kind: "folder" }> =>
            item.id === folderId && item.kind === "folder"
        )
  const expandedTabs =
    expandedFolder === undefined
      ? undefined
      : intent.kind === "reorder" && intent.folderId === folderId
        ? previewFolderTabs(
            expandedFolder.tabs,
            dragging?.item.id,
            intent.index
          )
        : dragging?.sourceFolderId === folderId &&
            dragging.sourceFolderIndex !== undefined
          ? previewFolderTabs(
              expandedFolder.tabs,
              dragging.item.id,
              dragging.sourceFolderIndex
            )
          : undefined

  const sensors = useGridSensors({ columnStep, rowStep })

  const overlay = (
    <GridDragOverlay
      dragging={dragging}
      intent={intent}
      preview={preview}
      columns={columns}
      columnStep={columnStep}
      rowStep={rowStep}
      gridGap={gridGap * coordinateScale}
      previewScale={coordinateScale}
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
          className="relative grid min-h-11 overflow-hidden"
          style={{
            width: box?.width,
            height: box?.height,
            gap: gridGap,
            gridTemplateColumns: `repeat(${columns}, ${metrics.rowSize}px)`,
            gridAutoRows: metrics.rowSize,
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
            className={`flex justify-center ${selecting ? "pb-28" : "pb-4"} ${fullViewport ? "px-0" : "px-5"}`}
            style={{
              margin: fullViewport ? undefined : "0 -20px",
              paddingTop: compactGrid ? 12 : 20,
            }}
          >
            <div
              ref={gridRef}
              data-tab-grid-track={preview ? undefined : ""}
              className="relative grid min-h-11"
              style={{
                width: width > 0 ? width : undefined,
                gap: gridGap,
                gridTemplateColumns: `repeat(${columns}, ${metrics.rowSize}px)`,
                gridAutoRows: metrics.rowSize,
              }}
            >
              {(width > 0 ? items : []).map((item) =>
                selecting ? (
                  <GridSelectionItem
                    key={item.id}
                    item={item}
                    placement={placements[item.id]}
                    selected={selectedIds.includes(item.id)}
                    onToggle={() => toggleSelection(item.id)}
                    selectAriaLabel={t("grid.chrome.selectItem", {
                      name: item.name,
                    })}
                  />
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
          {expandedFolder && (
            <CollectionExpansion
              collection={expandedFolder}
              closeLabel={t("grid.chrome.closeComponent", {
                label: componentLabel("folder", t),
              })}
              suspended={dialogSuspended}
              onClose={() => setFolderId(null)}
            >
              {(expandedTabs ?? expandedFolder.tabs).length > 0 && (
                <FolderExpandedGrid
                  folder={expandedFolder}
                  tabs={expandedTabs}
                />
              )}
            </CollectionExpansion>
          )}
          <BulkActions />
        </DndContext>
      </ContextMenuTrigger>
      <ContextMenuContent>
        <ContextMenuItem
          onClick={() => useComponentsApplicationStore.getState().setOpen(true)}
        >
          <Plus />
          {t("grid.chrome.addComponent")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
