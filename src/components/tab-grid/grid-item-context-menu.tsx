import type { ReactElement } from "react"
import { useState } from "react"
import { PencilSimple, Trash } from "@phosphor-icons/react"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { GridItem } from "@/lib/grid/types"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useTranslation } from "react-i18next"

export default function GridItemContextMenu({
  item,
  onEdit,
  children,
}: {
  item: GridItem
  onEdit: () => void
  children: ReactElement
}) {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const removeItem = useTabGridStore((state) => state.removeItem)
  return (
    <ContextMenu onOpenChange={() => setConfirmDelete(false)}>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="min-w-44">
        <ContextMenuGroup className="grid gap-0.5">
          <ContextMenuItem onClick={onEdit}>
            <PencilSimple />
            {t("grid.menu.edit")}
          </ContextMenuItem>
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
        </ContextMenuGroup>
      </ContextMenuContent>
    </ContextMenu>
  )
}
