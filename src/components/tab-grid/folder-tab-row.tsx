import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import TabSurface from "./tab-surface"
import type { TabEntry, TabItem } from "@/lib/grid/types"
import { TEXTURE_STEP } from "@/components/effects/texture-grid"

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
  // Convert the row pitch to texture rows; it must never shift local geometry.
  rowPitch?: number
  animated?: boolean
  entrance?: boolean
  preview?: boolean
}) {
  const item: TabItem = { ...tab, kind: "tab", size: "small", color }
  return (
    <div className="pointer-events-auto relative isolate h-full min-w-0 shrink-0">
      <TabSurface>
        <TabBackground
          item={item}
          textureId={textureId}
          textureRow={index * Math.round((rowPitch ?? 54) / TEXTURE_STEP)}
          animated={animated}
          entrance={entrance}
        />
        <TabUI item={item} preview={preview} compact />
      </TabSurface>
    </div>
  )
}
