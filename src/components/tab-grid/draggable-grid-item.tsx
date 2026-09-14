import { refreshFavicon } from "@/lib/favicon-cache"
import { ArrowClockwise } from "@phosphor-icons/react"
import { useLayoutEffect, useRef, useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import type { GridPlacement } from "./grid-layout"
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
import type { GridItem, TabEntry } from "./types"
import {
  getComponentDefinition,
  getComponentSizeOptions,
  supportsComponentAction,
} from "./model/registry"

function FolderDropGlow({
  color,
  progress,
}: {
  color: string
  progress?: number
}) {
  const glow = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    if (progress === undefined || !glow.current) return
    glow.current.style.opacity = String(0.08 + progress * 0.16)
  }, [progress])
  return (
    <div
      aria-hidden="true"
      data-folder-drop-glow
      data-active={progress !== undefined ? "true" : undefined}
      className="pointer-events-none absolute inset-0 rounded-[inherit] transition-opacity duration-200 ease-out will-change-[opacity] motion-reduce:transition-none"
      style={{ opacity: progress === undefined ? 0 : 1 }}
    >
      <div
        ref={glow}
        className="absolute inset-0 rounded-[inherit]"
        style={{ background: color, opacity: 0.08, filter: "blur(12px)" }}
      />
    </div>
  )
}

export default function DraggableGridItem({
  item,
  onOpen,
  onEdit,
  placement,
  dropProgress,
  folderTabs,
}: {
  dropProgress?: number
  folderTabs?: TabEntry[]
  placement: GridPlacement
  item: GridItem
  onOpen: () => void
  onEdit: () => void
}) {
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

  return (
    <ContextMenu onOpenChange={() => setConfirmDelete(false)}>
      <ContextMenuTrigger
        render={<article />}
        ref={motionRef}
        data-grid-item-id={item.id}
        {...attributes}
        role="group"
        aria-label={`拖动 ${item.name} 放置`}
        className={`relative col-span-4 min-w-0 cursor-grab outline-none ${isDragging ? "invisible" : `group isolate rounded-2xl ${definition.tileBorder ? "border" : ""} focus-visible:ring-2 focus-visible:ring-ring`}`}
        style={{
          gridColumn: `${placement.x + 1} / span ${placement.width ?? 4}`,
          gridRow: `${placement.y + 1} / span ${placement.height}`,
        }}
        onMouseDown={(event) => {
          if (event.button !== 0) return
          listeners?.onMouseDown?.(event)
        }}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget)
            listeners?.onKeyDown?.(event)
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <FolderDropGlow color={item.color} progress={dropProgress} />
        <div
          data-grid-item-content
          className={`relative h-full rounded-[inherit] ${isDragging ? "hidden" : ""}`}
        >
          <GridTileContent
            item={item}
            onOpen={onOpen}
            folderTabs={folderTabs}
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent>
        {sizeOptions.length > 0 && (
          <div
            className="mb-1 grid gap-2 px-1 py-2"
            style={{
              gridTemplateColumns: `repeat(${sizeOptions.length}, minmax(0, 1fr))`,
            }}
            role="group"
            aria-label={`${definition.label}大小`}
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
                  {option.menuLabel}
                </Badge>
              </ContextMenuItem>
            ))}
          </div>
        )}
        {item.kind === "tab" && (
          <ContextMenuItem onClick={() => void refreshFavicon(item.url)}>
            <ArrowClockwise />
            刷新图标
          </ContextMenuItem>
        )}
        <ContextMenuItem onClick={onEdit}>
          <PencilSimple />
          编辑
        </ContextMenuItem>
        {(supportsComponentAction(item.kind, "randomColor") ||
          supportsComponentAction(item.kind, "dynamicEffect")) && (
          <>
            {supportsComponentAction(item.kind, "randomColor") && (
              <ContextMenuItem onClick={() => randomizeItemColor(item.id)}>
                <Shuffle />
                随机颜色
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
                动态效果
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
            {confirmDelete ? "确认删除" : "删除"}
            {confirmDelete && item.kind === "folder" && (
              <span className="block text-xs opacity-75">
                包括文件夹内的标签
              </span>
            )}
          </span>
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
