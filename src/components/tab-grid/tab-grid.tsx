import { useGridSelectionStore } from "@/stores/grid-selection-store"
import BulkActions from "./bulk-actions"
import { Check, Plus } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"
import { columnsForWidth } from "@/lib/grid/grid-layout"
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
  type DragMoveEvent,
  type KeyboardCoordinateGetter,
} from "@dnd-kit/core"
import { useTabGridStore } from "@/stores/tab-grid-store"
import DraggableGridItem from "./draggable-grid-item"
import GridTileContent from "./grid-tile-content"
import GridItemDialog from "./grid-item-dialog"
import CollectionExpansion from "./collection/expansion"
import { getComponentDefinition } from "@/lib/grid/registry"
import {
  itemHeight,
  itemWidth,
  placeItems,
  type GridPositions,
} from "@/lib/grid/grid-layout"
import type { GridItem } from "@/lib/grid/types"
import { mixHexColor } from "./folder-drop"
import EffectSurface from "@/components/effects/effect-surface"
import { ItemGlow } from "./grid-dnd-overlay"
import {
  previewFolderTabs,
  previewTodoTasks,
  useGridDrag,
} from "./use-grid-drag"

const emptyPositions: GridPositions = {}

export default function TabGrid() {
  const selecting = useGridSelectionStore((state) => state.active)
  const selectedIds = useGridSelectionStore((state) => state.ids)
  const toggleSelection = useGridSelectionStore((state) => state.toggle)
  const items = useTabGridStore((state) => state.items)
  const layouts = useTabGridStore((state) => state.layouts)
  const ensureLayout = useTabGridStore((state) => state.ensureLayout)
  const gridRef = useRef<HTMLDivElement>(null)
  const pointer = useRef<{ x: number; y: number } | null>(null)
  const [width, setWidth] = useState(0)
  const [editor, setEditor] = useState<{ item?: GridItem } | null>(null)
  const [folderId, setFolderId] = useState<string | null>(null)
  const widthColumns = columnsForWidth(width)
  const compactGrid = width > 0 && width < 640
  const gridGap = compactGrid ? 12 : 16
  const [settledTarget, setSettledTarget] = useState<
    | {
        id: string
        position: { x: number; y: number }
      }
    | undefined
  >(undefined)

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
      placeItems(items, columns, layouts[columns] ?? emptyPositions),
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
    cancelTimers,
  } = drag

  // The drag session freezes its own column count and positions snapshot, so
  // geometry must be recomputed against the session's columns while dragging.
  const columns = dragging?.columns ?? widthColumns
  const columnStep = (width + gridGap) / columns
  const rowStep = columnStep

  const positions =
    heldLayout ?? dragging?.positions ?? layouts[columns] ?? emptyPositions
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
  const placements = placeItems(
    previewItems,
    columns,
    positions,
    dragging && intent.kind === "grid" && !intent.holdLayout
      ? settledTarget
      : undefined,
    dragging?.sourceFolderId ? [dragging.sourceFolderId] : []
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
      cancelTimers()
      observer.disconnect()
      document.removeEventListener("mousemove", trackPointer)
    }
  }, [cancelTimers])

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

  const releaseProgress =
    dragging &&
    (intent.kind === "grid" ||
      intent.kind === "folder" ||
      intent.kind === "reorder" ||
      intent.kind === "todo-reorder")
      ? intent.releaseProgress
      : dragging?.sourceFolderId
        ? 0
        : 1
  const overlayItem = !dragging
    ? undefined
    : intent.kind === "folder" && dragging.item.kind === "tab"
      ? {
          ...dragging.item,
          color: mixHexColor(
            dragging.item.color,
            intent.color,
            intent.progress
          ),
        }
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
        : dragging.item
  // A tab dragged out of a folder starts as its source row and only ever
  // grows into the full tile (releaseProgress). Grid items keep their grab
  // size for the whole drag — approaching a folder never resizes the overlay.
  const compactSize = dragging?.sourceFolderId
    ? { width: dragging.width, height: dragging.height }
    : undefined
  const fullWidth = dragging
    ? columnStep * itemWidth(dragging.item, columns) - gridGap
    : undefined
  const fullHeight = dragging
    ? itemHeight(dragging.item) * rowStep - gridGap
    : undefined
  const overlayWidth =
    dragging && compactSize && fullWidth !== undefined
      ? compactSize.width + (fullWidth - compactSize.width) * releaseProgress
      : dragging?.width
  const overlayHeight =
    dragging && compactSize && fullHeight !== undefined
      ? compactSize.height + (fullHeight - compactSize.height) * releaseProgress
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
          {createPortal(
            <DragOverlay
              zIndex={1000}
              dropAnimation={
                dragging?.sourceFolderId ||
                (intent.kind === "folder" && intent.ready) ||
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
                  data-tab-grid-overlay
                  className="pointer-events-none relative cursor-grabbing"
                  style={{ width: overlayWidth, height: overlayHeight }}
                >
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
                    {dragging.todoTask ? (
                      <div className="relative flex h-full items-center gap-2 px-3 py-2">
                        <EffectSurface
                          color={dragging.item.color}
                          textureId={dragging.todoTask.id}
                        />
                        <span className="relative z-10 flex size-4 shrink-0 items-center justify-center rounded-sm border border-foreground/50">
                          {dragging.todoTask.done && <Check size={12} />}
                        </span>
                        <span className="relative z-10 min-w-0 flex-1 truncate text-sm font-medium">
                          {dragging.todoTask.text}
                        </span>
                      </div>
                    ) : (
                      <GridTileContent
                        item={overlayItem ?? dragging.item}
                        onOpen={() => {}}
                        preview
                        compactTab={releaseProgress < 1}
                      />
                    )}
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
          添加组件
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
