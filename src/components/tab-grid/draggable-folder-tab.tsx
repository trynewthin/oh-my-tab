import { refreshFavicon } from "@/lib/favicon-cache"
import { ArrowClockwise } from "@phosphor-icons/react"
import { useCallback, useRef, useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { PencilSimple } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"
import FolderTabEditor from "./folder-tab-editor"
import FolderTabRow from "./folder-tab-row"
import type { TabEntry } from "./types"
import type { FolderTabDragData } from "./drag-types"

type Props = {
  tab: TabEntry
  color: string
  folderId: string
  index: number
  surface: "preview" | "dialog"
  animated?: boolean
}

export default function DraggableFolderTab({
  tab,
  color,
  folderId,
  index,
  surface,
  animated = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const node = useRef<HTMLDivElement | null>(null)
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `folder-tab:${surface}:${folderId}:${tab.id}`,
    data: {
      type: "folder-tab",
      tabId: tab.id,
      folderId,
      surface,
      getElement: () => node.current,
    } satisfies FolderTabDragData,
  })
  const ref = useCallback(
    (element: HTMLDivElement | null) => {
      node.current = element
      setNodeRef(element)
    },
    [setNodeRef]
  )
  return (
    <ContextMenu open={menuOpen} onOpenChange={setMenuOpen}>
      <ContextMenuTrigger
        render={<div />}
        data-folder-interaction-open={menuOpen || editing ? "true" : undefined}
        ref={ref}
        {...attributes}
        role="group"
        aria-label={`拖动 ${tab.name}`}
        className="h-full cursor-grab rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
        style={{ opacity: isDragging ? 0.2 : 1 }}
        onMouseDown={(event) => {
          if (event.button !== 0) return
          event.stopPropagation()
          listeners?.onMouseDown?.(event)
        }}
        onKeyDown={(event) => {
          if (event.target === event.currentTarget) {
            event.stopPropagation()
            listeners?.onKeyDown?.(event)
          }
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        <FolderTabRow
          tab={tab}
          color={color}
          folderId={folderId}
          index={index}
          animated={animated}
          entrance
        />
      </ContextMenuTrigger>
      <ContextMenuContent positionerClassName="z-[80]">
        <ContextMenuItem onClick={() => void refreshFavicon(tab.url)}>
          <ArrowClockwise />
          刷新图标
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setEditing(true)}>
          <PencilSimple />
          编辑
        </ContextMenuItem>
      </ContextMenuContent>
      {editing && (
        <FolderTabEditor
          folderId={folderId}
          tab={tab}
          onClose={() => setEditing(false)}
        />
      )}
    </ContextMenu>
  )
}
