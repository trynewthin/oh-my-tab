import type { CSSProperties } from "react"
import type { TabAppearance } from "@/lib/tab-appearance"

const fontFamilies = {
  system: "inherit",
  sans: "Arial, Helvetica, sans-serif",
  serif: "Georgia, 'Times New Roman', serif",
  mono: "ui-monospace, SFMono-Regular, Menlo, monospace",
}
export function tabTextStyle(appearance: TabAppearance): CSSProperties {
  return {
    fontFamily: fontFamilies[appearance.fontFamily],
    fontSize: appearance.fontSize,
    fontWeight: appearance.fontWeight,
    color: appearance.textColor === "theme" ? undefined : appearance.textColor,
    opacity: appearance.textOpacity / 100,
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
}
