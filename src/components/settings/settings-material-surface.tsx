import { useMemo, useRef } from "react"
import MaterialSurface from "@/components/effects/material-surface"
import { createFairIsleTexture } from "@/lib/fair-isle"
import type { MaterialStyle } from "@/lib/material"
import {
  defaultSettingsPanelOpacity,
  resolveSettingsBackgroundMask,
  settingsPanelMaterial,
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
  panelOpacity = defaultSettingsPanelOpacity,
  panelBlur = 0,
}: {
  material: MaterialStyle | typeof settingsPanelMaterial
  placement: "background" | "sidebar"
  backgroundMask?: SettingsBackgroundMask
  parameters?: SettingsMaterialParameters
  fairIslePreview?: { guides: boolean; fit: boolean }
  panelOpacity?: number
  panelBlur?: number
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
    placement === "background" && material !== settingsPanelMaterial
      ? resolveSettingsBackgroundMask(material, backgroundMask)
      : null
  const blur = mask?.blur ? `blur(${mask.blur}px)` : undefined

  if (material === settingsPanelMaterial) {
    const panelFilter = panelBlur > 0 ? `blur(${panelBlur}px)` : undefined
    return (
      <div
        aria-hidden="true"
        data-settings-material-surface={placement}
        data-material={material}
        className="pointer-events-none absolute inset-0 rounded-[inherit]"
        style={{
          backgroundColor: `color-mix(in oklab, var(--muted) ${panelOpacity}%, transparent)`,
          backdropFilter: panelFilter,
          WebkitBackdropFilter: panelFilter,
        }}
      />
    )
  }

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
