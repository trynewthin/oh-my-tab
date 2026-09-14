import DraggableFolderTab from "./draggable-folder-tab"
import {
  FOLDER_INSERT_GAP_CLASS,
  previewFolderEntries,
  useFolderInsertPreview,
} from "./folder-insert-preview"
import { useLayoutFlip } from "./use-layout-flip"
import type { FolderItem } from "./types"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "./collection/layout"

export default function FolderExpandedGrid({ folder }: { folder: FolderItem }) {
  const insertPreview = useFolderInsertPreview()
  const entries = previewFolderEntries(folder.tabs, insertPreview, folder.id)
  const flipRef = useLayoutFlip(entries.map((entry) => entry.key).join("|"))
  return (
    <CollectionViewport
      ref={flipRef}
      expanded
      data-folder-surface="dialog"
      data-folder-id={folder.id}
      label={`${folder.name}内的标签`}
    >
      <CollectionGrid expanded>
        {entries.map((entry, index) => (
          <CollectionRow
            key={entry.key}
            data-flip-id={entry.key}
            data-tab-id={entry.tab?.id}
            inert={entry.gap ? true : undefined}
            className={entry.gap ? FOLDER_INSERT_GAP_CLASS : undefined}
          >
            {entry.tab && (
              <DraggableFolderTab
                tab={entry.tab}
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
