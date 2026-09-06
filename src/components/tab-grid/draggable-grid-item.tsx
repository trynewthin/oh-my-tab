import { refreshFavicon } from "@/lib/favicon-cache"
import { ArrowClockwise } from "@phosphor-icons/react"
import { useState } from "react"
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
import type { GridItem } from "./types"

export default function DraggableGridItem({
  item,
  onOpen,
  onEdit,
  placement,
  dropState,
}: {
  dropState?: "pending" | "ready"
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
        className={`group relative isolate col-span-4 min-w-0 cursor-grab rounded-2xl ${item.kind === "dot-canvas" || item.kind === "ecosystem" ? "" : "border"} outline-none focus-visible:ring-2 focus-visible:ring-ring ${dropState === "ready" ? "ring-2 ring-primary" : dropState === "pending" ? "ring-2 ring-primary/30" : ""}`}
        style={{
          gridColumn: `${placement.x + 1} / span 4`,
          gridRow: `${placement.y + 1} / span ${placement.height}`,
          opacity: isDragging ? 0 : 1,
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
        <GridTileContent item={item} onOpen={onOpen} />
        {dropState && (
          <span className="pointer-events-none absolute inset-x-2 bottom-2 z-30 rounded-lg bg-primary px-2 py-1 text-center text-xs text-primary-foreground">
            {dropState === "ready" ? "松手放入文件夹" : "继续停留，等待确认"}
          </span>
        )}
      </ContextMenuTrigger>
      <ContextMenuContent>
        {(item.kind === "tab" || item.kind === "folder") && (
          <div
            className="mb-1 flex gap-3 px-1 py-2"
            role="group"
            aria-label={item.kind === "folder" ? "文件夹大小" : "标签大小"}
          >
            {(item.kind === "folder"
              ? ([
                  { value: "small", label: "小 · 4×2" },
                  { value: "large", label: "大 · 4×4" },
                  { value: "tall", label: "高 · 4×8" },
                ] as const)
              : ([
                  { value: "small", label: "小 · 4×1" },
                  { value: "medium", label: "中 · 4×2" },
                ] as const)
            ).map((option) => (
              <ContextMenuItem
                key={option.value}
                role="menuitemradio"
                aria-checked={item.size === option.value}
                className="flex-1 justify-center rounded-2xl p-0 focus:ring-2 focus:ring-ring"
                onClick={() => resizeItem(item.id, option.value)}
              >
                <Badge
                  variant={item.size === option.value ? "default" : "outline"}
                  className="h-7 w-full justify-center px-3"
                >
                  {option.label}
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
        {(item.kind === "tab" || item.kind === "folder") && (
          <>
            <ContextMenuItem onClick={() => randomizeItemColor(item.id)}>
              <Shuffle />
              随机颜色
            </ContextMenuItem>
            <ContextMenuCheckboxItem
              checked={!!item.dynamicEffect}
              onCheckedChange={(checked) =>
                setItemDynamicEffect(item.id, checked)
              }
            >
              <Fire />
              动态效果
            </ContextMenuCheckboxItem>
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
