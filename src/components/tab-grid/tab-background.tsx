import EffectSurface from "@/components/effects/effect-surface"
import TabIcon from "./tab-icon"
import type { TabItem } from "./types"
import type { ComponentProps } from "react"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

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
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)

  return (
    <>
      <EffectSurface
        color={item.color}
        textureId={textureId}
        {...effects}
        glass={backgroundType !== "solid"}
      />
      {showIcon && (
        <div className="pointer-events-none absolute inset-y-0 right-3 z-10 flex items-center opacity-90 sm:right-5">
          <TabIcon
            key={item.url}
            url={item.url}
            className={
              compact
                ? "size-5"
                : item.size === "small"
                  ? "size-6 sm:size-7"
                  : "size-8 sm:size-12"
            }
          />
        </div>
      )}
    </>
  )
}
