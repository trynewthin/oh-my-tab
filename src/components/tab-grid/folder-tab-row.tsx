import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import type { TabEntry, TabItem } from "@/lib/grid/types"

export default function FolderTabRow({
  tab,
  color,
  folderId,
  textureId = folderId,
  index = 0,
  rowPitch,
  animated = false,
  entrance = false,
  preview = false,
}: {
  tab: TabEntry
  color: string
  folderId: string
  textureId?: string
  index?: number
  // Caller-snapped to a multiple of the 9px cell step, so the texture advances
  // whole cells per row. Defaults to 54 (46px row + 8px gap).
  rowPitch?: number
  animated?: boolean
  entrance?: boolean
  preview?: boolean
}) {
  const item: TabItem = { ...tab, kind: "tab", size: "small", color }
  return (
    <div className="pointer-events-auto relative isolate h-full min-w-0 shrink-0 rounded-2xl border border-tile-border transition-colors">
      <TabBackground
        item={item}
        compact
        textureId={textureId}
        offsetY={index * (rowPitch ?? 54)}
        animated={animated}
        entrance={entrance}
      />
      <TabUI item={item} preview={preview} />
    </div>
  )
}
