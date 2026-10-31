import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import ComponentEditPopover from "./component-edit-popover"
import ButtonSlotAddDialog from "./button-slot-add-dialog"
import ButtonSlotRemovePopover from "./button-slot-remove-popover"
import BulkActions from "./bulk-actions"
import {
  gridOccupancyBox,
  itemHeight,
  itemWidth,
  placeItems,
  resolveGridGeometry,
  positionsOnly,
  type GridPositions,
} from "@/lib/grid/grid-layout"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { DndContext, type DragMoveEvent } from "@dnd-kit/core"
import { useTabGridStore } from "@/stores/tab-grid-store"
import DraggableGridItem from "./draggable-grid-item"
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
import { useHomeSettingsStore } from "@/stores/home-settings-store"

const emptyPositions: GridPositions = {}
const ignoreItem = () => {}

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
  const overlayActive = useSystemOverlayStore((state) => state.active)
  const [editSession, setEditSession] = useState<{
    id: string
    viewport: HTMLElement | null
    top: number
    left: number
  } | null>(null)
  const editingItemId = editSession?.id
  const [addingToDockId, setAddingToDockId] = useState<string | null>(null)
  const [slotRemoval, setSlotRemoval] = useState<{
    slotId: string
    controlId: string
    anchor: HTMLElement
  } | null>(null)
  const openSlotRemoval = useCallback(
    (controlId: string, anchor: HTMLElement) => {
      if (editingItemId)
        setSlotRemoval({ slotId: editingItemId, controlId, anchor })
    },
    [editingItemId]
  )
  const openDockDialog = useCallback(() => {
    setSlotRemoval(null)
    if (editingItemId) setAddingToDockId(editingItemId)
  }, [editingItemId])
  const [editorAnchor, setEditorAnchor] = useState<HTMLElement | null>(null)
  const resizeItem = useTabGridStore((state) => state.resizeItem)
  const [resizePreview, setResizePreview] = useState<{
    id: string
    size: GridItem["size"]
  } | null>(null)
  const { t } = useTranslation()
  const selectedIds = useGridSelectionStore((state) => state.ids)
  const toggleSelection = useGridSelectionStore((state) => state.toggle)
  const storeItems = useTabGridStore((state) => state.items)
  const savedItems = itemsOverride ?? storeItems
  const editedItem =
    !preview && !selecting && !overlayActive
      ? savedItems.find((item) => item.id === editingItemId)
      : undefined
  const removingControl =
    editedItem?.kind === "button-slot" && editedItem.id === slotRemoval?.slotId
      ? editedItem.controls.find(
          (control) => control.id === slotRemoval.controlId
        )
      : undefined
  const items =
    editedItem && resizePreview
      ? savedItems.map((item) =>
          item.id === resizePreview.id
            ? ({ ...item, size: resizePreview.size } as GridItem)
            : item
        )
      : savedItems
  const layouts = useTabGridStore((state) => state.layouts)
  const ensureLayout = useTabGridStore((state) => state.ensureLayout)
  const wideGridColumns = useHomeSettingsStore((state) => state.wideGridColumns)
  const narrowGridColumns = useHomeSettingsStore(
    (state) => state.narrowGridColumns
  )
  const gridScale = useHomeSettingsStore((state) => state.gridScale)
  const folderRadius = useHomeSettingsStore(
    (state) => state.tabAppearance.radius
  )
  const gridRef = useRef<HTMLDivElement>(null)
  const measurementRef = useRef<HTMLDivElement>(null)
  const { pointer, measuredWidth } = useGridMeasurement({
    gridRef,
    containerRef: measurementRef,
    contentBox: !preview,
    trackWidth,
  })
  const sourceWidth = trackWidth ?? measuredWidth
  const geometry = resolveGridGeometry(
    sourceWidth,
    wideGridColumns,
    narrowGridColumns,
    gridScale
  )
  const metrics = geometry.metrics
  const box = area
    ? gridOccupancyBox(sourceWidth, area.columns, area.rows)
    : null
  const width =
    box?.width ?? (sourceWidth > 0 ? geometry.trackWidth : measuredWidth)
  const [folderId, setFolderId] = useState<string | null>(null)
  const editItem = useCallback((item: GridItem) => {
    const viewport =
      gridRef.current?.closest<HTMLElement>("[data-grid-scroll]") ?? null
    setEditSession({
      id: item.id,
      viewport,
      top: viewport?.scrollTop ?? 0,
      left: viewport?.scrollLeft ?? 0,
    })
    setAddingToDockId(null)
    setSlotRemoval(null)
    setFolderId(null)
  }, [])
  const openItem = useCallback(
    (item: GridItem) => {
      const action = getComponentDefinition(item.kind).openAction
      if (action === "edit") editItem(item)
      if (action === "expand") setFolderId(item.id)
    },
    [editItem]
  )
  useLayoutEffect(() => {
    // Restore only at the edit handoff, before paint; scrolling while editing remains free.
    if (editSession?.viewport?.isConnected) {
      editSession.viewport.scrollTo({
        top: editSession.top,
        left: editSession.left,
        behavior: "instant",
      })
    }
  }, [editSession])
  const widthColumns = area?.columns ?? metrics.columns
  const compactGrid = metrics.compact
  const gridGap = metrics.gap
  const liveGridReady = !preview && sourceWidth > 0
  const coordinateScale = preview
    ? previewScale
    : liveGridReady
      ? geometry.scale
      : 1
  const [scaledGridHeight, setScaledGridHeight] = useState(0)
  const [settledTarget, setSettledTarget] = useState<
    | {
        id: string
        position: { x: number; y: number }
      }
    | undefined
  >(undefined)
  useEffect(() => {
    const close = () => {
      setEditSession(null)
      setAddingToDockId(null)
      setSlotRemoval(null)
      setResizePreview(null)
    }
    const unsubscribeSelection = useGridSelectionStore.subscribe((state) => {
      if (state.active) close()
    })
    const unsubscribeOverlay = useSystemOverlayStore.subscribe((state) => {
      if (state.active) close()
    })
    return () => {
      unsubscribeSelection()
      unsubscribeOverlay()
    }
  }, [])

  // Previews keep placements in local state; the live grid reads the store.
  const [previewPlaced, setPreviewPlaced] = useState<GridPositions>(
    () => previewPositions ?? emptyPositions
  )
  const [previewSeed, setPreviewSeed] = useState(previewPositions)
  if (previewSeed !== previewPositions) {
    setPreviewSeed(previewPositions)
    setPreviewPlaced(previewPositions ?? emptyPositions)
  }

  // The session freezes its columns at startDrag and reads stored placements,
  // never the live preview; resolvePlacements closes over that lazily.
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
    scheduleIntent,
    finishDrag,
    resetDrag,
  } = drag

  // Session columns can differ from the live width during a drag.
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
  const includeFolderTab = !!(dragging?.sourceFolderId && gridTarget)
  const previewItems = useMemo(
    () => (includeFolderTab && dragging ? [...items, dragging.item] : items),
    [items, dragging, includeFolderTab]
  )
  const liveTarget =
    dragging && intent.kind === "grid" && !intent.holdLayout
      ? settledTarget
      : undefined
  const resizeTarget = editedItem && resizePreview ? resizePreview : null
  const sourceFolderId = dragging?.sourceFolderId
  const placements = useMemo(() => {
    if (preview && liveTarget) {
      // Preview runs the drop-commit resolution, so animation matches the landing.
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
      resizeTarget
        ? {
            id: resizeTarget.id,
            position: positions[resizeTarget.id] ?? { x: 0, y: 0 },
          }
        : liveTarget,
      resizeTarget ? [resizeTarget.id] : sourceFolderId ? [sourceFolderId] : []
    )
  }, [
    preview,
    liveTarget,
    items,
    columns,
    area?.rows,
    positions,
    previewItems,
    resizeTarget,
    sourceFolderId,
  ])

  const folderIntentId =
    intent.kind === "folder" || intent.kind === "reorder"
      ? intent.folderId
      : undefined
  const folderIntentIndex = intent.kind === "reorder" ? intent.index : undefined
  const intentKind = intent.kind
  const sourceFolderIndex = dragging?.sourceFolderIndex
  const draggedId = dragging?.item.id
  const folderPreviews = useMemo(() => {
    const result = new Map<
      string,
      Extract<GridItem, { kind: "folder" }>["tabs"]
    >()
    for (const item of items) {
      if (item.kind !== "folder") continue
      if (
        item.id === folderIntentId &&
        (intentKind === "folder" || intentKind === "reorder")
      ) {
        result.set(
          item.id,
          previewFolderTabs(
            item.tabs,
            draggedId,
            folderIntentIndex ?? item.tabs.length
          )
        )
      } else if (
        item.id === sourceFolderId &&
        sourceFolderIndex !== undefined
      ) {
        result.set(
          item.id,
          previewFolderTabs(item.tabs, draggedId, sourceFolderIndex)
        )
      }
    }
    return result
  }, [
    items,
    folderIntentId,
    folderIntentIndex,
    intentKind,
    sourceFolderId,
    sourceFolderIndex,
    draggedId,
  ])
  const todoIntentId =
    intent.kind === "todo-reorder" ? intent.todoId : undefined
  const todoIntentIndex =
    intent.kind === "todo-reorder" ? intent.index : undefined
  const draggedTaskId = dragging?.todoTask?.id
  const todoPreview = useMemo(() => {
    const todo = items.find(
      (item) => item.id === todoIntentId && item.kind === "todo"
    )
    return todo?.kind === "todo" && todoIntentIndex !== undefined
      ? previewTodoTasks(todo.tasks, draggedTaskId, todoIntentIndex)
      : undefined
  }, [items, todoIntentId, todoIntentIndex, draggedTaskId])

  useEffect(() => {
    if (preview || width <= 0 || dragging || resizePreview) return
    ensureLayout(columns)
  }, [
    preview,
    columns,
    width,
    items,
    layouts,
    dragging,
    resizePreview,
    ensureLayout,
  ])

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
      contentScale={coordinateScale}
    />
  )

  useLayoutEffect(() => {
    if (preview) return
    const element = gridRef.current
    if (!element) return
    const update = () => setScaledGridHeight(element.offsetHeight)
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    return () => observer.disconnect()
  }, [preview, columns, items])

  // Preview reuses the full drag pipeline but commits to local state.
  if (preview) {
    return (
      <DndContext
        sensors={sensors}
        onDragStart={startDrag}
        onDragMove={(event: DragMoveEvent) => scheduleIntent(event.delta)}
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
              onOpen={ignoreItem}
              onEdit={ignoreItem}
            />
          ))}
        </div>
        {overlay}
      </DndContext>
    )
  }

  return (
    <section
      data-tour="grid"
      aria-label={t("grid.chrome.grid")}
      className={`min-h-0 w-full ${fullViewport ? "" : "mx-auto max-w-[1280px]"}`}
    >
      <DndContext
        sensors={sensors}
        onDragStart={startDrag}
        onDragMove={(event: DragMoveEvent) => scheduleIntent(event.delta)}
        onDragEnd={finishDrag}
        onDragCancel={resetDrag}
      >
        <div
          ref={measurementRef}
          className={`flex justify-center ${selecting ? "pb-28" : "pb-4"} ${fullViewport ? "px-0" : "px-5"}`}
          style={{
            margin: fullViewport ? undefined : "0 -20px",
            paddingTop: fullViewport ? 8 : compactGrid ? 12 : 20,
          }}
        >
          <div
            ref={gridRef}
            data-tab-grid-track={preview ? undefined : ""}
            data-grid-component-columns={
              liveGridReady ? geometry.componentColumns : undefined
            }
            data-grid-scale={liveGridReady ? coordinateScale : undefined}
            className="relative grid min-h-11"
            style={{
              width: width > 0 ? width : undefined,
              gap: gridGap,
              gridTemplateColumns: `repeat(${columns}, ${metrics.rowSize}px)`,
              gridAutoRows: metrics.rowSize,
              flexShrink: liveGridReady ? 0 : undefined,
              transform: liveGridReady
                ? `scale(${coordinateScale})`
                : undefined,
              transformOrigin: liveGridReady ? "top left" : undefined,
              marginRight: liveGridReady
                ? geometry.visualWidth - width
                : undefined,
              marginBottom:
                liveGridReady && scaledGridHeight > 0
                  ? scaledGridHeight * coordinateScale - scaledGridHeight
                  : undefined,
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
                  onAnchorChange={
                    editedItem?.id === item.id ? setEditorAnchor : undefined
                  }
                  onAddControl={
                    editedItem?.id === item.id ? openDockDialog : undefined
                  }
                  onRemoveControl={
                    editedItem?.id === item.id ? openSlotRemoval : undefined
                  }
                  resize={
                    editedItem?.id === item.id
                      ? {
                          columns,
                          columnStep,
                          rowStep,
                          onPreview: (id, size) =>
                            setResizePreview(
                              size === null ? null : { id, size }
                            ),
                          onCommit: (id, size) => {
                            const next = savedItems.map((entry) =>
                              entry.id === id
                                ? ({ ...entry, size } as GridItem)
                                : entry
                            )
                            const nextPlacements = placeItems(
                              next,
                              columns,
                              positions,
                              { id, position: positions[id] ?? { x: 0, y: 0 } },
                              [id]
                            )
                            resizeItem(id, size)
                            useTabGridStore
                              .getState()
                              .setLayout(columns, positionsOnly(nextPlacements))
                          },
                        }
                      : undefined
                  }
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
                    intent.kind === "slot" && intent.slotId === item.id
                      ? 1
                      : intent.kind === "folder" && intent.folderId === item.id
                        ? intent.progress
                        : undefined
                  }
                  folderTabs={folderPreviews.get(item.id)}
                  todoTasks={
                    item.kind === "todo" && todoIntentId === item.id
                      ? todoPreview
                      : undefined
                  }
                  onOpen={openItem}
                  onEdit={editItem}
                />
              )
            )}
          </div>
        </div>
        {overlay}
        {editedItem && editorAnchor && (
          <ComponentEditPopover
            key={editedItem.id}
            item={editedItem}
            anchor={editorAnchor}
            columns={columns}
            childDialogOpen={
              addingToDockId === editedItem.id || !!removingControl
            }
            onClose={() => {
              setEditSession(null)
              setAddingToDockId(null)
              setSlotRemoval(null)
              setResizePreview(null)
            }}
          />
        )}
        {editedItem?.kind === "button-slot" &&
          addingToDockId === editedItem.id && (
            <ButtonSlotAddDialog
              key={editedItem.id}
              item={editedItem}
              onClose={() => setAddingToDockId(null)}
              returnFocus={editorAnchor}
            />
          )}
        {slotRemoval && removingControl && (
          <ButtonSlotRemovePopover
            key={`${slotRemoval.slotId}-${slotRemoval.controlId}`}
            slotId={slotRemoval.slotId}
            control={removingControl}
            anchor={slotRemoval.anchor}
            columns={columns}
            returnFocus={editorAnchor}
            onClose={() => setSlotRemoval(null)}
          />
        )}
        {expandedFolder && (
          <CollectionExpansion
            collection={expandedFolder}
            backgroundAnimated={false}
            radius={folderRadius}
            folderBorder
            closeLabel={t("grid.chrome.closeComponent", {
              label: componentLabel("folder", t),
            })}
            suspended={dialogSuspended}
            onClose={() => setFolderId(null)}
          >
            {(expandedTabs ?? expandedFolder.tabs).length > 0 && (
              <FolderExpandedGrid folder={expandedFolder} tabs={expandedTabs} />
            )}
          </CollectionExpansion>
        )}
        <BulkActions />
      </DndContext>
    </section>
  )
}
