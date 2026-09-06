import EffectSurface from "@/components/effects/effect-surface"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function PopupBackground() {
  const color = useHomeSettingsStore((state) => state.color)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background"
    >
      <EffectSurface
        color={color}
        textureId="popup-background"
        animated
        entrance
      />
    </div>
  )
}
