import type { CSSProperties, ReactNode } from "react"
import {
  backgroundPaletteStyle,
  type BackgroundPaletteId,
} from "@/lib/background-palettes"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

// Solid palette background for previews of the home page. Image backgrounds
// fall back to the gray palette so the previewed component stays legible.
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
