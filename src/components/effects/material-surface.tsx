import type { ComponentProps, RefObject } from "react"
import {
  createFairIsleTexture,
  fairIsleTileGeometry,
  type FairIsleTexture,
} from "@/lib/fair-isle"
import { defaultFairIsleSettings } from "@/lib/fair-isle-settings"
import {
  defaultLiquidGlass,
  type LiquidGlassSettings,
} from "@/lib/liquid-glass"
import type { MaterialStyle } from "@/lib/material"
import EffectSurface from "./effect-surface"
import LiquidGlassSurface from "./liquid-glass-surface"
import StarTrailsSurface from "./star-trails-surface"

export type { MaterialStyle } from "@/lib/material"

export type FairIsleAppearance = {
  texture: FairIsleTexture
  stitchSize: number
  offset?: { x: number; y: number }
  guides?: boolean
  fit?: boolean
}

export default function MaterialSurface({
  effectStyle,
  speed,
  staticFrame,
  fairIsle,
  liquidGlass,
  liquidGlassSample,
  liquidGlassPointerTarget,
  ...props
}: Omit<ComponentProps<typeof EffectSurface>, "effectStyle"> & {
  effectStyle: MaterialStyle
  speed?: number
  staticFrame?: boolean
  fairIsle?: FairIsleAppearance
  liquidGlass?: LiquidGlassSettings
  liquidGlassSample?: boolean
  liquidGlassPointerTarget?: RefObject<HTMLElement | null>
}) {
  if (effectStyle === "liquid-glass") {
    return (
      <LiquidGlassSurface
        settings={liquidGlass ?? defaultLiquidGlass}
        sample={liquidGlassSample}
        pointerTarget={liquidGlassPointerTarget}
      />
    )
  }
  if (effectStyle === "fair-isle") {
    const texture = fairIsle?.texture ?? createFairIsleTexture()
    const stitch = fairIsle?.stitchSize ?? defaultFairIsleSettings.stitchSize
    const tile = fairIsleTileGeometry(texture, stitch)
    const { x, y } = fairIsle?.offset ?? { x: 0, y: 0 }
    const image = texture.backgroundImage
    const guides =
      "linear-gradient(to right, #fff9 1px, transparent 1px), linear-gradient(to bottom, #fff9 1px, transparent 1px)"
    return (
      <div
        aria-hidden="true"
        data-effect-style={effectStyle}
        className="pointer-events-none absolute inset-0 z-0 rounded-[inherit] bg-repeat"
        style={{
          backgroundImage: fairIsle?.guides ? `${guides}, ${image}` : image,
          backgroundSize: fairIsle?.fit
            ? "contain"
            : `${tile.width}px ${tile.height}px`,
          backgroundPosition: fairIsle?.fit
            ? "center"
            : `calc(50% + ${x}px) ${tile.top + y}px`,
          backgroundRepeat: fairIsle?.fit ? "no-repeat" : undefined,
        }}
      />
    )
  }
  return effectStyle === "star-trails" ? (
    <StarTrailsSurface {...props} speed={speed} staticFrame={staticFrame} />
  ) : (
    <EffectSurface {...props} effectStyle={effectStyle} />
  )
}
