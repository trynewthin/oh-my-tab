import type { CSSProperties } from "react"
import {
  getBackgroundPalette,
  type BackgroundPaletteId,
} from "./background-palette-model"
export {
  backgroundPalettes,
  isBackgroundPaletteId,
  getBackgroundPalette,
  type BackgroundPaletteId,
} from "./background-palette-model"

export function backgroundPaletteStyle(id: BackgroundPaletteId): CSSProperties {
  const palette = getBackgroundPalette(id)
  return {
    "--home-background-light": palette.light,
    "--home-background-dark": palette.dark,
  } as CSSProperties
}
