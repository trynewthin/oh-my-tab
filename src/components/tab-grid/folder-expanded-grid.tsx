import DraggableFolderTab from "./draggable-folder-tab"
import type { FolderItem, TabEntry } from "./types"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "./collection/layout"

export default function FolderExpandedGrid({
  folder,
  tabs,
}: {
  folder: FolderItem
  tabs?: TabEntry[]
}) {
  const visibleTabs = tabs ?? folder.tabs
  return (
    <CollectionViewport
      expanded
      data-folder-surface="dialog"
      data-folder-id={folder.id}
      label={`${folder.name}内的标签`}
    >
      <CollectionGrid expanded data-expanded-folder-grid>
        {visibleTabs.map((tab, index) => (
          <CollectionRow
            key={tab.id}
            data-tab-id={tab.id === "__folder-gap__" ? undefined : tab.id}
          >
            {tab.id === "__folder-gap__" ? (
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-2 inset-y-1.5 rounded-xl"
                style={{
                  background: folder.color,
                  opacity: 0.22,
                  filter: "blur(6px)",
                }}
              />
            ) : (
              <DraggableFolderTab
                tab={tab}
                color={folder.color}
                folderId={folder.id}
                index={index}
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
