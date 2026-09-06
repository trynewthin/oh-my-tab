import EffectSurface from "@/components/effects/effect-surface"
import TabIcon from "./tab-icon"
import type { TabItem } from "./types"
import type { ComponentProps } from "react"

export default function TabBackground({
  item,
  showIcon = true,
  compact = false,
  textureId = item.id,
  ...effects
}: Omit<ComponentProps<typeof EffectSurface>, "color" | "textureId"> & {
  item: TabItem
  showIcon?: boolean
  compact?: boolean
  textureId?: string
}) {
  return (
    <>
      <EffectSurface color={item.color} textureId={textureId} {...effects} />
      {showIcon && (
        <div className="pointer-events-none absolute inset-y-0 right-5 z-10 flex items-center opacity-90">
          <TabIcon
            key={item.url}
            url={item.url}
            className={
              compact ? "size-5" : item.size === "small" ? "size-7" : "size-12"
            }
          />
        </div>
      )}
    </>
  )
}
