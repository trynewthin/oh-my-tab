import { useMemo, useRef } from "react"
import MaterialSurface from "@/components/effects/material-surface"
import { createFairIsleTexture } from "@/lib/fair-isle"
import type { MaterialStyle } from "@/lib/material"
import {
  resolveSettingsBackgroundMask,
  type SettingsBackgroundMask,
  type SettingsMaterialParameters,
} from "@/lib/ui-appearance"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function SettingsMaterialSurface({
  material,
  placement,
  backgroundMask,
  parameters,
  fairIslePreview,
}: {
  material: MaterialStyle
  placement: "background" | "sidebar"
  backgroundMask?: SettingsBackgroundMask
  parameters?: SettingsMaterialParameters
  fairIslePreview?: { guides: boolean; fit: boolean }
}) {
  const color = useHomeSettingsStore((state) => state.color)
  const fairIsle = useHomeSettingsStore(
    (state) => parameters?.["fair-isle"] ?? state.fairIsle
  )
  const glass = useHomeSettingsStore(
    (state) => parameters?.["liquid-glass"] ?? state.liquidGlass
  )
  const pointerTarget = useRef<HTMLElement | null>(null)
  const amplitude =
    material === "burning" || material === "particles"
      ? parameters?.[material]
      : undefined
  const starTrails = parameters?.["star-trails"]
  const texture = useMemo(
    () => (material === "fair-isle" ? createFairIsleTexture(fairIsle) : null),
    [material, fairIsle]
  )
  const mask =
    placement === "background"
      ? resolveSettingsBackgroundMask(material, backgroundMask)
      : null
  const blur = mask?.blur ? `blur(${mask.blur}px)` : undefined

  return (
    <div
      ref={
        material === "liquid-glass"
          ? (node) => {
              pointerTarget.current = node?.parentElement ?? null
            }
          : undefined
      }
      aria-hidden="true"
      data-settings-material-surface={placement}
      data-material={material}
      className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
    >
      <MaterialSurface
        color={color}
        textureId={`settings-${placement}`}
        effectStyle={material}
        coverage={100}
        amplitude={amplitude}
        speed={starTrails?.speed}
        animated={
          material === "star-trails"
            ? starTrails?.mode === "dynamic"
            : !!amplitude
        }
        staticFrame={starTrails?.mode !== "dynamic"}
        fairIsle={
          texture
            ? { texture, stitchSize: fairIsle.stitchSize, ...fairIslePreview }
            : undefined
        }
        liquidGlass={glass}
        liquidGlassPointerTarget={pointerTarget}
        transparent
      />
      {mask && (mask.strength > 0 || mask.blur > 0) && (
        <div
          data-settings-background-mask
          className="absolute inset-0"
          style={{
            backgroundColor: `color-mix(in oklab, var(--popover) ${mask.strength}%, transparent)`,
            backdropFilter: blur,
            WebkitBackdropFilter: blur,
          }}
        />
      )}
      {placement === "sidebar" && material === "fair-isle" && (
        <div className="absolute inset-0 bg-popover/60" />
      )}
    </div>
  )
}
