import EffectSurface from "@/components/effects/effect-surface"
import type { TabItem } from "@/lib/grid/types"
import type { ComponentProps } from "react"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function TabBackground({
  item,
  textureId = item.id,
  coverage,
  ...effects
}: Omit<ComponentProps<typeof EffectSurface>, "color" | "textureId"> & {
  item: TabItem
  textureId?: string
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const tabEffectCoverage = useHomeSettingsStore(
    (state) => state.tabEffectCoverage
  )
  const appearance = useHomeSettingsStore((state) => state.tabAppearance)
  const fill =
    appearance.backgroundColor === "item"
      ? item.color
      : appearance.backgroundColor
  const background =
    appearance.backgroundMode === "transparent"
      ? "transparent"
      : appearance.backgroundMode === "gradient"
        ? `linear-gradient(${appearance.gradientAngle}deg, ${fill}, ${appearance.backgroundEndColor})`
        : appearance.backgroundMode === "solid"
          ? fill
          : backgroundType === "solid"
            ? "var(--card)"
            : "color-mix(in srgb, var(--card) 55%, transparent)"

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
      style={{
        opacity: appearance.backgroundOpacity / 100,
        backdropFilter: appearance.backgroundBlur
          ? `blur(${appearance.backgroundBlur}px)`
          : undefined,
      }}
    >
      <div className="absolute inset-0" style={{ background }} />
      <div
        className="absolute overflow-hidden"
        style={{
          inset: appearance.borderStyle === "none" ? 0 : appearance.borderWidth,
          borderRadius: Math.max(
            0,
            appearance.radius -
              (appearance.borderStyle === "none" ? 0 : appearance.borderWidth)
          ),
        }}
      >
        <EffectSurface
          color={item.color}
          textureId={textureId}
          coverage={coverage ?? tabEffectCoverage}
          {...effects}
          transparent
        />
      </div>
    </div>
  )
}
