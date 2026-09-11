import {
  backgroundPaletteStyle,
  getBackgroundPalette,
} from "@/lib/background-palettes"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

function SolidBackground({
  paletteId,
}: {
  paletteId: Parameters<typeof getBackgroundPalette>[0]
}) {
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

function ImageBackground({ image }: { image: string | null }) {
  return (
    <div
      aria-hidden="true"
      data-home-background="image"
      className="pointer-events-none absolute inset-0 z-0 bg-background bg-cover bg-center bg-no-repeat"
      style={image ? { backgroundImage: `url(${image})` } : undefined}
    />
  )
}

export default function HomeBackground() {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const paletteId = useHomeSettingsStore((state) => state.backgroundPalette)
  const image = useHomeSettingsStore((state) => state.backgroundImage)

  if (backgroundType === "image") return <ImageBackground image={image} />
  return <SolidBackground paletteId={paletteId} />
}
