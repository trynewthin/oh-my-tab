import { useDraggable } from "@dnd-kit/core"
import { useCallback } from "react"
import type { GridPlacement } from "@/lib/grid/grid-layout"
import { useGridMotion } from "./use-grid-motion"
import GridTileContent from "./grid-tile-content"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"
import { getComponentDefinition } from "@/lib/grid/registry"
import { useTranslation } from "react-i18next"
import GridItemContextMenu from "./grid-item-context-menu"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import GridResizeHandle, { type GridResizeControls } from "./grid-resize-handle"
import { useGridResizeMotion } from "./use-grid-resize-motion"

export default function DraggableGridItem({
  item,
  onOpen,
  onEdit,
  placement,
  dropProgress,
  folderTabs,
  todoTasks,
  interactive = true,
  resize,
  onAnchorChange,
  onAddControl,
  onRemoveControl,
}: {
  dropProgress?: number
  folderTabs?: TabEntry[]
  todoTasks?: TodoTask[]
  placement: GridPlacement
  item: GridItem
  onOpen: (item: GridItem) => void
  onEdit: (item: GridItem) => void
  // Preview grids keep drag+FLIP but drop the context menu and dialog hooks.
  interactive?: boolean
  resize?: GridResizeControls
  onAnchorChange?: (element: HTMLElement | null) => void
  onAddControl?: () => void
  onRemoveControl?: (controlId: string, anchor: HTMLElement) => void
}) {
  const { t } = useTranslation()
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
    disabled: !!resize,
  })

  const definition = getComponentDefinition(item.kind)

  const setAnchor = useCallback(
    (element: HTMLElement | null) => {
      setNodeRef(element)
      onAnchorChange?.(element)
    },
    [setNodeRef, onAnchorChange]
  )
  const motionRef = useGridMotion(placement, isDragging, setAnchor)
  const visualRef = useGridResizeMotion(
    placement,
    resize?.columnStep ?? 0,
    resize?.rowStep ?? 0
  )
  const open = useCallback(() => onOpen(item), [onOpen, item])
  const edit = useCallback(() => onEdit(item), [onEdit, item])

  const tile = (
    <article
      ref={motionRef}
      data-grid-item-id={item.id}
      data-grid-editing={resize ? "" : undefined}
      {...attributes}
      role="group"
      aria-label={t("grid.chrome.dragItem", { name: item.name })}
      className={`group relative isolate min-w-0 outline-none ${resize ? "cursor-default" : "cursor-grab"} ${isDragging ? "invisible" : "focus-visible:ring-2 focus-visible:ring-ring"}`}
      style={{
        borderRadius: radius,
        gridColumn: `${placement.x + 1} / span ${placement.width}`,
        gridRow: `${placement.y + 1} / span ${placement.height}`,
      }}
      onMouseDownCapture={(event) => {
        if (resize) return
        if (event.button === 0 && item.kind === "search-minimal")
          listeners?.onMouseDown?.(event)
      }}
      onMouseDown={(event) => {
        if (resize) return
        if (event.button !== 0 || item.kind === "search-minimal") return
        listeners?.onMouseDown?.(event)
      }}
      onKeyDown={(event) => {
        if (resize) return
        if (event.target === event.currentTarget) listeners?.onKeyDown?.(event)
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <div
        ref={visualRef}
        data-grid-resize-surface
        className={`relative h-full w-full origin-top-left rounded-[inherit] ${definition.tileBorder ? (item.kind === "folder" ? "border border-transparent" : "border border-tile-border") : ""}`}
      >
        <div
          data-grid-item-content
          inert={resize && item.kind !== "button-slot" ? true : undefined}
          className={`relative h-full rounded-[inherit] transition-transform duration-200 ease-out motion-reduce:transition-none ${isDragging ? "hidden" : ""}`}
          style={{
            transform:
              dropProgress !== undefined
                ? `scale(${1 + dropProgress * 0.04})`
                : undefined,
          }}
        >
          <GridTileContent
            item={item}
            onOpen={open}
            preview={!interactive}
            editing={!!resize}
            onAddControl={onAddControl}
            onRemoveControl={onRemoveControl}
            folderTabs={folderTabs}
            todoTasks={todoTasks}
          />
        </div>
        {resize && (
          <GridResizeHandle item={item} placement={placement} {...resize} />
        )}
      </div>
    </article>
  )

  if (!interactive) return tile

  return (
    <GridItemContextMenu item={item} onEdit={edit}>
      {tile}
    </GridItemContextMenu>
  )
}
