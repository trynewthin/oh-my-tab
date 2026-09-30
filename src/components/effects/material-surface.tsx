import type { ComponentProps } from "react"
import type { EffectStyle } from "@/stores/home-settings-store"
import EffectSurface from "./effect-surface"
import StarTrailsSurface from "./star-trails-surface"

export type MaterialStyle = EffectStyle | "star-trails"

export default function MaterialSurface({
  effectStyle,
  speed,
  staticFrame,
  ...props
}: Omit<ComponentProps<typeof EffectSurface>, "effectStyle"> & {
  effectStyle: MaterialStyle
  speed?: number
  staticFrame?: boolean
}) {
  return effectStyle === "star-trails" ? (
    <StarTrailsSurface {...props} speed={speed} staticFrame={staticFrame} />
  ) : (
    <EffectSurface {...props} effectStyle={effectStyle} />
  )
}
