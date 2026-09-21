import type { ReactElement } from "react"
import { useState } from "react"
import {
  ArrowClockwise,
  Fire,
  PencilSimple,
  Shuffle,
  Trash,
} from "@phosphor-icons/react"
import { refreshFavicon } from "@/application/favicon-cache"
import { Badge } from "@/components/ui/badge"
import {
  ContextMenu,
  ContextMenuCheckboxItem,
  ContextMenuContent,
  ContextMenuGroup,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import type { GridItem } from "@/lib/grid/types"
import {
  componentLabel,
  getComponentMenuOperations,
  getComponentSizeOptions,
  occupancyMark,
  type ComponentMenuOperation,
} from "@/lib/grid/registry"
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
  const resizeItem = useTabGridStore((state) => state.resizeItem)
  const randomizeItemColor = useTabGridStore(
    (state) => state.randomizeItemColor
  )
  const setItemDynamicEffect = useTabGridStore(
    (state) => state.setItemDynamicEffect
  )
  const sizeOptions = getComponentSizeOptions(item.kind, "menu")
  const operations = getComponentMenuOperations(item.kind)

  function renderOperation(operation: ComponentMenuOperation) {
    switch (operation) {
      case "refreshIcon":
        if (item.kind !== "tab") return null
        return (
          <ContextMenuItem
            key={operation}
            onClick={() => void refreshFavicon(item.url)}
          >
            <ArrowClockwise />
            {t("grid.menu.refreshIcon")}
          </ContextMenuItem>
        )
      case "edit":
        return (
          <ContextMenuItem key={operation} onClick={onEdit}>
            <PencilSimple />
            {t("grid.menu.edit")}
          </ContextMenuItem>
        )
      case "randomColor":
        return (
          <ContextMenuItem
            key={operation}
            onClick={() => randomizeItemColor(item.id)}
          >
            <Shuffle />
            {t("grid.menu.randomColor")}
          </ContextMenuItem>
        )
      case "dynamicEffect":
        return (
          <ContextMenuCheckboxItem
            key={operation}
            checked={!!item.dynamicEffect}
            onCheckedChange={(checked) =>
              setItemDynamicEffect(item.id, checked)
            }
          >
            <Fire />
            {t("grid.menu.dynamicEffect")}
          </ContextMenuCheckboxItem>
        )
    }
  }

  return (
    <ContextMenu onOpenChange={() => setConfirmDelete(false)}>
      <ContextMenuTrigger render={children} />
      <ContextMenuContent className="min-w-44">
        {sizeOptions.length > 0 && (
          <div
            className="grid grid-cols-2 gap-1 p-1"
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
        <ContextMenuGroup
          className={`grid gap-0.5 ${sizeOptions.length > 0 ? "mt-1" : ""}`}
        >
          {operations.map(renderOperation)}
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
