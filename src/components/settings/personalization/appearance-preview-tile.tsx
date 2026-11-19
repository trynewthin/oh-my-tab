import { WidgetTile } from "@/components/tab-grid/widget-ui"
import { gridTrackWidth } from "@/lib/grid/grid-layout"
import { getItemGridDimensions } from "@/lib/grid/registry"
import type { FolderItem, TabItem } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function AppearancePreviewTile({
  item,
  className,
}: {
  item: FolderItem | TabItem
  className: string
}) {
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  const { width, height } = getItemGridDimensions(item)
  const folder = item.kind === "folder"

  return (
    <div
      data-appearance-preview-size={item.size}
      className={`absolute isolate ${folder ? "border border-transparent" : ""} ${className}`}
      style={{
        width: gridTrackWidth(width),
        height: gridTrackWidth(height),
        borderRadius: folder ? radius : undefined,
      }}
    >
      <WidgetTile item={item} preview onOpen={() => {}} />
    </div>
  )
}
