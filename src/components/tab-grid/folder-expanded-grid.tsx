import DraggableFolderTab from "./draggable-folder-tab"
import type { FolderItem, TabEntry } from "@/lib/grid/types"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "./collection/layout"
import { useTranslation } from "react-i18next"

export default function FolderExpandedGrid({
  folder,
  tabs,
}: {
  folder: FolderItem
  tabs?: TabEntry[]
}) {
  const { t } = useTranslation()
  const visibleTabs = tabs ?? folder.tabs
  return (
    <CollectionViewport
      expanded
      data-folder-surface="dialog"
      data-folder-id={folder.id}
      label={t("grid.folder.tabsInside", { name: folder.name })}
    >
      <CollectionGrid
        expanded
        data-expanded-folder-grid
        data-expanded-collection-grid
      >
        {visibleTabs.map((tab, index) => (
          <CollectionRow
            key={tab.id}
            data-tab-id={tab.id === "__folder-gap__" ? undefined : tab.id}
            className="relative h-12 after:pointer-events-none after:absolute after:inset-0 after:z-20 after:rounded-2xl after:bg-card/55 after:opacity-[var(--stack-shade,0)]"
          >
            {tab.id === "__folder-gap__" ? null : (
              <DraggableFolderTab
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
                rowPitch={0}
                textureId={`${folder.id}:${tab.id}`}
                animated={!!folder.dynamicEffect}
                surface="dialog"
              />
            )}
          </CollectionRow>
        ))}
      </CollectionGrid>
    </CollectionViewport>
  )
}
