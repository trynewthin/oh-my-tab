import DraggableFolderTab from "./draggable-folder-tab"
import type { FolderItem } from "./types"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "./collection/layout"

export default function FolderExpandedGrid({ folder }: { folder: FolderItem }) {
  return (
    <CollectionViewport
      expanded
      data-folder-surface="dialog"
      data-folder-id={folder.id}
      label={`${folder.name}内的标签`}
    >
      <CollectionGrid expanded>
        {folder.tabs.map((tab, index) => (
          <CollectionRow key={tab.id} data-tab-id={tab.id}>
            <DraggableFolderTab
              tab={tab}
              color={folder.color}
              folderId={folder.id}
              index={index}
              animated={!!folder.dynamicEffect}
              surface="dialog"
            />
          </CollectionRow>
        ))}
      </CollectionGrid>
    </CollectionViewport>
  )
}
