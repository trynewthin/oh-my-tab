import type { TabItem } from "@/lib/grid/types"
import type { TabAppearance } from "@/lib/tab-appearance"
import { useTabAppearance } from "./use-tab-style"
import TabContent from "./tab-content"
import TabIcon from "./tab-icon"

export default function TabUI({
  item,
  preview = false,
  compact = false,
  appearance: appearanceOverride,
  iconBaseSize,
}: {
  item: TabItem
  preview?: boolean
  compact?: boolean
  appearance?: TabAppearance
  iconBaseSize?: number
}) {
  const savedAppearance = useTabAppearance(item.size)
  const appearance = appearanceOverride ?? savedAppearance
  const content = (
    <TabContent
      name={item.name}
      size={item.size}
      compact={compact}
      appearance={appearance}
      iconBaseSize={iconBaseSize}
      icon={
        <TabIcon
          key={item.url}
          url={item.url}
          src={item.icon}
          className="h-full w-full"
          imageStyle={{
            objectFit: appearance.iconFit,
            borderRadius: `${appearance.iconRadius}%`,
          }}
        />
      }
    />
  )
  if (preview) return content
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.name}
      title={item.name}
      className="absolute inset-0 z-10 block overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
    >
      {content}
    </a>
  )
}
