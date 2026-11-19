export const tileAppearanceLevels = [
  "none",
  "small",
  "medium",
  "large",
] as const
export type TileAppearanceLevel = (typeof tileAppearanceLevels)[number]
export const folderShadowOptions = ["auto", ...tileAppearanceLevels] as const
export type FolderShadow = (typeof folderShadowOptions)[number]

type BorderStroke = {
  style: "none" | "solid" | "dashed" | "dotted"
  width: number
  opacity: number
}

const borderWidths: Record<TileAppearanceLevel, number> = {
  none: 0,
  small: 1,
  medium: 2,
  large: 3,
}

export function tileBorderLevel({ style, width, opacity }: BorderStroke) {
  if (style === "none" || width === 0 || opacity === 0) return "none"
  if (opacity !== 100) return null
  return (
    tileAppearanceLevels.find((level) => borderWidths[level] === width) ?? null
  )
}

export function tileBorderStroke(
  level: TileAppearanceLevel,
  style: BorderStroke["style"]
): BorderStroke {
  return {
    style: style === "none" ? "solid" : style,
    width: borderWidths[level],
    opacity: 100,
  }
}
