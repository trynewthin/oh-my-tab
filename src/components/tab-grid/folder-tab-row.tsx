import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import type { TabEntry, TabItem } from "./types"

export default function FolderTabRow({
  tab,
  color,
  folderId,
  index,
  animated = false,
  entrance = false,
}: {
  tab: TabEntry
  color: string
  folderId: string
  index: number
  animated?: boolean
  entrance?: boolean
}) {
  const item: TabItem = { ...tab, kind: "tab", size: "small", color }
  return (
    <div className="pointer-events-auto relative isolate h-full min-w-0 shrink-0 rounded-2xl border border-border/60 transition-colors hover:border-border">
      <TabBackground
        item={item}
        compact
        coverage={52}
        textureId={folderId}
        offsetY={index * 52}
        animated={animated}
        entrance={entrance}
      />
      <TabUI item={item} />
    </div>
  )
}
