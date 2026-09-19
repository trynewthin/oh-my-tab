import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import type { TabEntry, TabItem } from "@/lib/grid/types"

export default function FolderTabRow({
  tab,
  color,
  folderId,
  index = 0,
  rowPitch,
  animated = false,
  entrance = false,
  preview = false,
}: {
  tab: TabEntry
  color: string
  folderId: string
  index?: number
  // Pixel pitch between rows, snapped by the caller to a multiple of the
  // 9px cell step — the burning texture then advances whole cells per row,
  // so the pattern flows down the stack without ever clipping mid-cell.
  // Defaults to 54 (the dialog surface's 46px row + 8px gap pitch).
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
        coverage={52}
        textureId={folderId}
        offsetY={index * (rowPitch ?? 54)}
        animated={animated}
        entrance={entrance}
      />
      <TabUI item={item} preview={preview} />
    </div>
  )
}
