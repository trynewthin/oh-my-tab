import type { CSSProperties, ReactNode } from "react"
import {
  backgroundPaletteStyle,
  type BackgroundPaletteId,
} from "@/lib/background-palettes"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

// Paints the home page's solid background, so a preview shown away from the
// page matches the configured palette. An image background is too noisy behind
// a component, so that case falls back to the default theme palette.
export default function HomeSurface({
  className = "",
  children,
}: {
  className?: string
  children?: ReactNode
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const paletteId = useHomeSettingsStore((state) => state.backgroundPalette)
  const palette: BackgroundPaletteId =
    backgroundType === "image" ? "gray" : paletteId
  const style = {
    ...backgroundPaletteStyle(palette),
    backgroundColor: "var(--home-background)",
  } as CSSProperties

  return (
    <div
      data-home-palette={palette}
      data-home-background="solid"
      className={className}
      style={style}
    >
      {children}
    </div>
  )
}
