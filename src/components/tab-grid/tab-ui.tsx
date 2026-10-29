import type { CSSProperties } from "react"
import type { TabItem } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import type { TabAppearance } from "@/lib/tab-appearance"
import TabIcon from "./tab-icon"

const fontFamilies = {
  system: "inherit",
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
}
const alignment = { start: "flex-start", center: "center", end: "flex-end" }

export default function TabUI({
  item,
  preview = false,
  compact = false,
  appearance: appearanceOverride,
  iconBaseSize = compact ? 20 : item.size === "small" ? 28 : 48,
}: {
  item: TabItem
  preview?: boolean
  compact?: boolean
  appearance?: TabAppearance
  iconBaseSize?: number
}) {
  const savedAppearance = useHomeSettingsStore((state) => state.tabAppearance)
  const appearance = appearanceOverride ?? savedAppearance
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
    </div>
  )
  const textStyle: CSSProperties = {
    fontFamily: fontFamilies[appearance.fontFamily],
    fontSize: appearance.fontSize,
    fontWeight: appearance.fontWeight,
    color: appearance.textColor === "theme" ? undefined : appearance.textColor,
    opacity: appearance.textOpacity / 100,
    width: vertical ? "100%" : undefined,
    flexGrow: !vertical && appearance.justify === "between" ? 1 : undefined,
    textAlign: appearance.textAlign,
    lineHeight: appearance.lineHeight,
    letterSpacing: appearance.letterSpacing,
    maxHeight: `${appearance.maxLines * appearance.lineHeight}em`,
    overflow: "hidden",
    overflowWrap: "anywhere",
    whiteSpace: appearance.maxLines === 1 ? "nowrap" : "normal",
    textOverflow: appearance.textOverflow,
    display:
      appearance.maxLines > 1 && appearance.textOverflow === "ellipsis"
        ? "-webkit-box"
        : "block",
    WebkitBoxOrient: "vertical",
    WebkitLineClamp:
      appearance.maxLines > 1 && appearance.textOverflow === "ellipsis"
        ? appearance.maxLines
        : undefined,
  }
  const text = appearance.display !== "icon" && (
    <span
      key="text"
      data-tab-text
      className="min-h-0 max-w-full min-w-0 shrink"
      style={textStyle}
    >
      {item.name}
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
  if (preview)
    return (
      <div className={className} style={style} title={item.name}>
        {content}
      </div>
    )
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={item.name}
      className={className}
      style={style}
      title={item.name}
    >
      {content}
    </a>
  )
}
