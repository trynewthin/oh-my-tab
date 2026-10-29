import EffectSurface from "@/components/effects/effect-surface"
import type { TabItem } from "@/lib/grid/types"
import type { ComponentProps } from "react"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import type { TabAppearance } from "@/lib/tab-appearance"

export default function TabBackground({
  item,
  textureId = item.id,
  coverage,
  appearance: appearanceOverride,
  ...effects
}: Omit<ComponentProps<typeof EffectSurface>, "color" | "textureId"> & {
  item: TabItem
  textureId?: string
  appearance?: TabAppearance
}) {
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const tabEffectCoverage = useHomeSettingsStore(
    (state) => state.tabEffectCoverage
  )
  const savedAppearance = useHomeSettingsStore((state) => state.tabAppearance)
  const appearance = appearanceOverride ?? savedAppearance
  const quarterTurn =
    appearance.backgroundRotation === 90 ||
    appearance.backgroundRotation === 270
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
        backgroundColor: "var(--card)",
      }}
    >
      <div
        data-tab-background-layer="background"
        className="absolute overflow-hidden"
        style={{
          inset: appearance.borderStyle === "none" ? 0 : appearance.borderWidth,
          borderRadius: Math.max(
            0,
            appearance.radius -
              (appearance.borderStyle === "none" ? 0 : appearance.borderWidth)
          ),
          containerType: "size",
        }}
      >
        <div
          data-tab-background-transform
          className="absolute"
          style={{
            top: "50%",
            left: "50%",
            width: quarterTurn ? "100cqh" : "100%",
            height: quarterTurn ? "100cqw" : "100%",
            transform: `translate(-50%, -50%) scale(${appearance.backgroundFlipX ? -1 : 1}, ${appearance.backgroundFlipY ? -1 : 1}) rotate(${appearance.backgroundRotation}deg)`,
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
      <div
        data-tab-background-layer="mask"
        className="absolute inset-0 rounded-[inherit]"
        style={{
          background,
          opacity: appearance.backgroundOpacity / 100,
          backdropFilter: appearance.backgroundBlur
            ? `blur(${appearance.backgroundBlur}px)`
            : undefined,
        }}
      />
    </div>
  )
}
