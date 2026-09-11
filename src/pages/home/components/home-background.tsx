import {
  backgroundPaletteStyle,
  getBackgroundPalette,
} from "@/lib/background-palettes"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function HomeBackground() {
  const paletteId = useHomeSettingsStore((state) => state.backgroundPalette)
  const palette = getBackgroundPalette(paletteId)

  return (
    <div
      aria-hidden="true"
      data-home-palette={palette.id}
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        ...backgroundPaletteStyle(paletteId),
        backgroundColor: "var(--home-background)",
      }}
    />
  )
}
