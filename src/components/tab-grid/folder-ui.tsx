import FolderTabStack from "./folder-tab-stack"
import type { FolderItem } from "./types"
import {
  CollectionCardHeader,
  CollectionTitleButton,
} from "./collection/header"

export default function FolderUI({
  item,
  onOpen,
  preview = false,
}: {
  item: FolderItem
  onOpen: () => void
  preview?: boolean
}) {
  return (
    <div className="relative z-10 flex h-full w-full flex-col gap-1.5 overflow-hidden rounded-[inherit] p-2.5 text-left sm:gap-2 sm:p-3">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={`打开文件夹 ${item.name}`}
      />
      <CollectionCardHeader className="pr-2 pl-0.5 sm:pr-5 sm:pl-1">
        <CollectionTitleButton onClick={onOpen}>
          {item.name}
        </CollectionTitleButton>
      </CollectionCardHeader>
      {item.tabs.length > 0 && (
        <FolderTabStack
          draggable={!preview}
          folder={item}
          topBleed={28}
          className="flex-1"
        />
      )}
    </div>
  )
}
