import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import type { TabEntry, TabItem } from "./types"

export default function FolderTabRow({
  tab,
  color,
  folderId,
  index,
  animated = false,
}: {
  tab: TabEntry
  color: string
  folderId: string
  index: number
  animated?: boolean
}) {
  const item: TabItem = { ...tab, kind: "tab", size: "small", color }
  return (
    <div className="pointer-events-auto relative isolate h-11 min-w-0 shrink-0 rounded-2xl border">
      <TabBackground
        item={item}
        textureId={folderId}
        offsetY={index * 52}
        animated={animated}
      />
      <TabUI item={item} />
    </div>
  )
}
