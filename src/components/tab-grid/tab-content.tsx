import type { CSSProperties, ReactNode } from "react"
import type { TabSize } from "@/lib/grid/types"
import type { TabAppearance } from "@/lib/tab-appearance"
import { tabTextStyle } from "./tab-text-style"

const alignment = { start: "flex-start", center: "center", end: "flex-end" }

export default function TabContent({
  name,
  size,
  icon: iconContent,
  compact = false,
  appearance: configuredAppearance,
  iconBaseSize = compact
    ? 20
    : size === "small" || size === "square-small"
      ? 28
      : size === "square-large"
        ? 64
        : 48,
}: {
  name: string
  size: TabSize
  icon: ReactNode
  compact?: boolean
  appearance: TabAppearance
  iconBaseSize?: number
}) {
  const appearance =
    size === "square-small"
      ? { ...configuredAppearance, display: "icon" as const }
      : configuredAppearance
  const vertical =
    appearance.direction === "top" || appearance.direction === "bottom"
  const iconFirst =
    appearance.direction === "left" || appearance.direction === "top"
  const iconSize = (iconBaseSize * appearance.iconScale) / 100
  const icon = appearance.display !== "text" && (
    <div
      key="icon"
      data-tab-icon
      className="flex min-h-0 min-w-0 items-center justify-center overflow-hidden"
      style={{
        width: `min(${iconSize}px, 100cqw, 100cqh)`,
        height: `min(${iconSize}px, 100cqw, 100cqh)`,
        flexShrink: 1,
        opacity: appearance.iconOpacity / 100,
      }}
    >
      {iconContent}
    </div>
  )
  const textStyle: CSSProperties = {
    ...tabTextStyle(appearance),
    width: vertical ? "100%" : undefined,
    flexGrow: !vertical && appearance.justify === "between" ? 1 : undefined,
  }
  const text = appearance.display !== "icon" && (
    <span
      key="text"
      data-tab-text
      className="min-h-0 max-w-full min-w-0 shrink"
      style={textStyle}
    >
      {name}
    </span>
  )
  const content = (
    <div className="h-full w-full min-w-0" style={{ containerType: "size" }}>
      <div
        className="flex h-full w-full min-w-0"
        style={{
          flexDirection: vertical ? "column" : "row",
          justifyContent:
            appearance.justify === "between"
              ? "space-between"
              : alignment[appearance.justify],
          alignItems: alignment[appearance.align],
          gap: appearance.display === "both" ? appearance.gap : 0,
        }}
      >
        {iconFirst ? [icon, text] : [text, icon]}
      </div>
    </div>
  )
  const border = appearance.borderStyle === "none" ? 0 : appearance.borderWidth
  const style: CSSProperties = {
    padding: `${appearance.paddingY + border}px ${appearance.paddingX + border}px`,
  }
  const className =
    "absolute inset-0 z-10 block overflow-hidden rounded-[inherit] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
  return (
    <div className={className} style={style} title={name}>
      {content}
    </div>
  )
}
