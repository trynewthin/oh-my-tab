import { refreshFavicon } from "@/application/favicon-cache"
import { ArrowClockwise } from "@phosphor-icons/react"
import { useCallback, useRef, useState } from "react"
import { useDraggable } from "@dnd-kit/core"
import { PencilSimple, Trash } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuTrigger,
  ContextMenuContent,
  ContextMenuItem,
} from "@/components/ui/context-menu"
import FolderTabEditor from "./folder-tab-editor"
import FolderTabRow from "./folder-tab-row"
import { useTranslation } from "react-i18next"
import { useTabGridStore } from "@/stores/tab-grid-store"
import type { TabEntry } from "@/lib/grid/types"
import type { FolderTabDragData } from "./drag-types"

type Props = {
  tab: TabEntry
  color: string
  folderId: string
  index: number
  surface: "preview" | "dialog"
  rowPitch?: number
  textureId?: string
  animated?: boolean
}

export default function DraggableFolderTab({
  tab,
  color,
  folderId,
  index,
  surface,
  rowPitch,
  textureId,
  animated = false,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const removeFolderTab = useTabGridStore((state) => state.removeFolderTab)
  const { t } = useTranslation()
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
    <ContextMenu
      open={menuOpen}
      onOpenChange={(open) => {
        setMenuOpen(open)
        if (!open) setConfirmDelete(false)
      }}
    >
      <ContextMenuTrigger
        render={<div />}
        data-folder-interaction-open={menuOpen || editing ? "true" : undefined}
        ref={ref}
        {...attributes}
        role="group"
        aria-label={t("grid.folder.dragTab", { name: tab.name })}
        className="relative h-full cursor-grab rounded-2xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
        <div className={`h-full rounded-2xl ${isDragging ? "invisible" : ""}`}>
          <FolderTabRow
            tab={tab}
            color={color}
            folderId={folderId}
            textureId={textureId}
            index={index}
            rowPitch={rowPitch}
            animated={animated}
            entrance
          />
        </div>
      </ContextMenuTrigger>
      <ContextMenuContent positionerClassName="z-[80]">
        <ContextMenuItem onClick={() => void refreshFavicon(tab.url)}>
          <ArrowClockwise />
          {t("grid.menu.refreshIcon")}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => setEditing(true)}>
          <PencilSimple />
          {t("grid.menu.edit")}
        </ContextMenuItem>
        <ContextMenuItem
          variant="destructive"
          closeOnClick={confirmDelete}
          onClick={() => {
            if (confirmDelete) removeFolderTab(folderId, tab.id)
            else setConfirmDelete(true)
          }}
        >
          <Trash />
          {confirmDelete ? t("grid.menu.confirmDelete") : t("grid.menu.delete")}
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
