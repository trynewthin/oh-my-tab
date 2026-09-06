import DraggableFolderTab from "./draggable-folder-tab"
import type { FolderItem } from "./types"

export default function FolderExpandedGrid({ folder }: { folder: FolderItem }) {
  return (
    <div
      data-folder-surface="dialog"
      data-folder-id={folder.id}
      role="region"
      aria-label={`${folder.name}内的标签`}
      tabIndex={0}
      className="min-h-24 flex-1 [scrollbar-width:none] overflow-y-auto overscroll-contain rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring"
      onKeyDown={(event) => {
        if (event.target !== event.currentTarget) return
        const top =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? event.currentTarget.scrollHeight
              : event.key === "ArrowDown"
                ? event.currentTarget.scrollTop + 56
                : event.key === "ArrowUp"
                  ? event.currentTarget.scrollTop - 56
                  : null
        if (top === null) return
        event.preventDefault()
        event.stopPropagation()
        event.currentTarget.scrollTo({ top })
      }}
    >
      <div role="list" className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {folder.tabs.map((tab, index) => (
          <div
            key={tab.id}
            data-stack-row
            data-tab-id={tab.id}
            role="listitem"
            className="h-11 min-w-0"
          >
            <DraggableFolderTab
              tab={tab}
              color={folder.color}
              folderId={folder.id}
              index={index}
              animated={!!folder.dynamicEffect}
              surface="dialog"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
