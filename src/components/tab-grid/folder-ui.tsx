import FolderTabStack from "./folder-tab-stack"
import type { FolderItem } from "./types"

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
    <div className="relative z-10 flex h-full w-full flex-col gap-2 overflow-hidden rounded-[inherit] p-3 text-left">
      <button
        type="button"
        onClick={onOpen}
        className="absolute inset-0 rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
        aria-label={`打开文件夹 ${item.name}`}
      />
      <button
        type="button"
        onClick={onOpen}
        className="relative z-20 flex h-5 w-full min-w-0 shrink-0 items-center gap-2 pr-5 pl-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate text-sm font-medium">{item.name}</span>
      </button>
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
