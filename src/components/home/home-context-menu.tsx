import type { ReactElement } from "react"
import { useTranslation } from "react-i18next"
import { FolderPlus, Gear, Plus } from "@phosphor-icons/react"
import { runSystemAction } from "@/application/system-actions"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"

export default function HomeContextMenu({
  children,
}: {
  children: ReactElement
}) {
  const { t } = useTranslation()
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={children}
        onContextMenuCapture={(event) => {
          if (
            event.target instanceof Element &&
            event.target.closest('input, textarea, [contenteditable="true"]')
          )
            event.stopPropagation()
        }}
      />
      <ContextMenuContent>
        <ContextMenuItem onClick={() => runSystemAction("open-components")}>
          <Plus />
          {t("grid.chrome.addComponent")}
        </ContextMenuItem>
        <ContextMenuItem
          onClick={() => useSystemOverlayStore.getState().open("add-folder")}
        >
          <FolderPlus />
          {t("shell.systemActions.addFolder")}
        </ContextMenuItem>
        <ContextMenuItem onClick={() => runSystemAction("open-settings")}>
          <Gear />
          {t("shell.settingsButton.open")}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}
