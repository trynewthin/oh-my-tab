import { refreshFavicon } from "@/application/favicon-cache"
import { ArrowClockwise } from "@phosphor-icons/react"
import { useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { GridPlacement } from "@/lib/grid/grid-layout"
import { PencilSimple, Shuffle, Fire, Trash } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuCheckboxItem,
} from "@/components/ui/context-menu"
import { Badge } from "@/components/ui/badge"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useGridMotion } from "./use-grid-motion"
import GridTileContent from "./grid-tile-content"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"
import {
  componentLabel,
  getComponentDefinition,
  getComponentSizeOptions,
  occupancyMark,
  supportsComponentAction,
} from "@/lib/grid/registry"
import { useTranslation } from "react-i18next"

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
  const [confirmDelete, setConfirmDelete] = useState(false)
  const removeItem = useTabGridStore((state) => state.removeItem)
  const setItemDynamicEffect = useTabGridStore(
    (state) => state.setItemDynamicEffect
  )
  const randomizeItemColor = useTabGridStore(
    (state) => state.randomizeItemColor
  )
  const resizeItem = useTabGridStore((state) => state.resizeItem)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: item.id,
  })

  const definition = getComponentDefinition(item.kind)
  const sizeOptions = getComponentSizeOptions(item.kind, "menu")

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
      onMouseDown={(event) => {
        if (event.button !== 0) return
        if (
          (item.kind === "search-minimal" || item.kind === "search-full") &&
          !(event.target as Element).closest("[data-grid-drag-handle]")
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
    <ContextMenu onOpenChange={() => setConfirmDelete(false)}>
      <ContextMenuTrigger render={tile} />
      <ContextMenuContent>
        {sizeOptions.length > 0 && (
          <div
            className="mb-1 grid gap-2 px-1 py-2"
            style={{
              gridTemplateColumns: `repeat(${sizeOptions.length}, minmax(0, 1fr))`,
            }}
            role="group"
            aria-label={t("grid.chrome.sizeOptions", {
              label: componentLabel(item.kind, t),
            })}
          >
            {sizeOptions.map((option) => (
              <ContextMenuItem
                key={option.value}
                role="menuitemradio"
                aria-checked={item.size === option.value}
                className="justify-center rounded-2xl p-0 focus:ring-2 focus:ring-ring"
                onClick={() => resizeItem(item.id, option.value)}
              >
                <Badge
                  variant={item.size === option.value ? "default" : "outline"}
                  className="h-7 w-full justify-center px-3"
                >
                  {occupancyMark(option.width, option.height)}
                </Badge>
              </ContextMenuItem>
            ))}
          </div>
        )}
        {item.kind === "tab" && (
          <ContextMenuItem onClick={() => void refreshFavicon(item.url)}>
            <ArrowClockwise />
            {t("grid.menu.refreshIcon")}
          </ContextMenuItem>
        )}
        {item.kind !== "search-minimal" && item.kind !== "search-full" && (
          <ContextMenuItem onClick={onEdit}>
            <PencilSimple />
            {t("grid.menu.edit")}
          </ContextMenuItem>
        )}
        {(supportsComponentAction(item.kind, "randomColor") ||
          supportsComponentAction(item.kind, "dynamicEffect")) && (
          <>
            {supportsComponentAction(item.kind, "randomColor") && (
              <ContextMenuItem onClick={() => randomizeItemColor(item.id)}>
                <Shuffle />
                {t("grid.menu.randomColor")}
              </ContextMenuItem>
            )}
            {supportsComponentAction(item.kind, "dynamicEffect") && (
              <ContextMenuCheckboxItem
                checked={!!item.dynamicEffect}
                onCheckedChange={(checked) =>
                  setItemDynamicEffect(item.id, checked)
                }
              >
                <Fire />
                {t("grid.menu.dynamicEffect")}
              </ContextMenuCheckboxItem>
            )}
          </>
        )}
        <ContextMenuItem
          variant="destructive"
          closeOnClick={confirmDelete}
          onClick={() => {
            if (confirmDelete) removeItem(item.id)
            else setConfirmDelete(true)
          }}
        >
          <Trash />
          <span>
            {confirmDelete
              ? t("grid.menu.confirmDelete")
              : t("grid.menu.delete")}
            {confirmDelete && item.kind === "folder" && (
              <span className="block text-xs opacity-75">
                {t("grid.menu.deleteFolderHint")}
              </span>
            )}
          </span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
