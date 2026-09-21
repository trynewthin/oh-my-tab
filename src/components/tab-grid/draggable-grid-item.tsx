import { useDraggable } from "@dnd-kit/core"
import type { GridPlacement } from "@/lib/grid/grid-layout"
import { useGridMotion } from "./use-grid-motion"
import GridTileContent from "./grid-tile-content"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"
import { getComponentDefinition } from "@/lib/grid/registry"
import { useTranslation } from "react-i18next"
import GridItemContextMenu from "./grid-item-context-menu"

export default function DraggableGridItem({
  item,
  onOpen,
  onEdit,
  placement,
  dropProgress,
  folderTabs,
  todoTasks,
  interactive = true,
}: {
  dropProgress?: number
  folderTabs?: TabEntry[]
  todoTasks?: TodoTask[]
  placement: GridPlacement
  item: GridItem
  onOpen: () => void
  onEdit: () => void
  // Preview grids keep drag+FLIP but drop the context menu and dialog hooks.
  interactive?: boolean
}) {
  const { t } = useTranslation()
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  })

  const definition = getComponentDefinition(item.kind)

  const motionRef = useGridMotion(placement, isDragging, setNodeRef)

  const tile = (
    <article
      ref={motionRef}
      data-grid-item-id={item.id}
      {...attributes}
      role="group"
      aria-label={t("grid.chrome.dragItem", { name: item.name })}
      className={`relative min-w-0 cursor-grab outline-none ${isDragging ? "invisible" : `group isolate rounded-2xl ${definition.tileBorder ? "border border-tile-border" : ""} focus-visible:ring-2 focus-visible:ring-ring`}`}
      style={{
        gridColumn: `${placement.x + 1} / span ${placement.width}`,
        gridRow: `${placement.y + 1} / span ${placement.height}`,
      }}
      onMouseDownCapture={(event) => {
        if (
          event.button === 0 &&
          (item.kind === "search-minimal" || item.kind === "search-full")
        )
          listeners?.onMouseDown?.(event)
      }}
      onMouseDown={(event) => {
        if (
          event.button !== 0 ||
          item.kind === "search-minimal" ||
          item.kind === "search-full"
        )
          return
        listeners?.onMouseDown?.(event)
      }}
      onKeyDown={(event) => {
        if (event.target === event.currentTarget) listeners?.onKeyDown?.(event)
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <div
        data-grid-item-content
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
          onOpen={onOpen}
          preview={!interactive}
          folderTabs={folderTabs}
          todoTasks={todoTasks}
        />
      </div>
    </article>
  )

  if (!interactive) return tile

  return (
    <GridItemContextMenu item={item} onEdit={onEdit}>
      {tile}
    </GridItemContextMenu>
  )
}
