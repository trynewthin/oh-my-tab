import type { CSSProperties } from "react"

export const backgroundPalettes = [
  { id: "gray", label: "黑白", light: "#ffffff", dark: "#000000" },
  { id: "neutral", label: "中性灰", light: "#f9f9f9", dark: "#191919" },
  { id: "slate", label: "静谧蓝灰", light: "#f9f9fb", dark: "#18191b" },
  { id: "mauve", label: "柔紫灰", light: "#faf9fb", dark: "#1a191b" },
  { id: "rose", label: "柔粉灰", light: "#fff7f8", dark: "#1b1113" },
  { id: "sand", label: "温暖砂灰", light: "#f9f9f8", dark: "#191918" },
] as const

export type BackgroundPaletteId = (typeof backgroundPalettes)[number]["id"]

export function isBackgroundPaletteId(
  value: unknown
): value is BackgroundPaletteId {
  return backgroundPalettes.some((palette) => palette.id === value)
}

export function getBackgroundPalette(id: BackgroundPaletteId) {
  return (
    backgroundPalettes.find((palette) => palette.id === id) ??
    backgroundPalettes[0]
  )
}

export function backgroundPaletteStyle(
  id: BackgroundPaletteId
): CSSProperties {
  const palette = getBackgroundPalette(id)
  return {
    "--home-background-light": palette.light,
    "--home-background-dark": palette.dark,
  } as CSSProperties
}
