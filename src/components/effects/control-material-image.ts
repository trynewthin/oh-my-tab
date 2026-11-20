import type { MaterialStyle } from "@/lib/material"
import { liquidGlassOptics, type LiquidGlassSettings } from "@/lib/liquid-glass"
import { createBurningTexture, textureSeed } from "./burning-texture"
import { createParticleCell } from "./particle-texture"

export function controlMaterialImage(
  material: MaterialStyle | undefined,
  color: string,
  glass: LiquidGlassSettings,
  strength = 1
) {
  if (material === "liquid-glass") {
    const { tint, opacity, sheenIntensity } = liquidGlassOptics(glass)
    const tintLayer = `linear-gradient(135deg, color-mix(in srgb, ${tint} ${opacity * 50}%, transparent), color-mix(in srgb, ${tint} ${opacity * 100}%, transparent))`
    if (!glass.sheen || sheenIntensity === 0) return tintLayer
    return `linear-gradient(135deg, color-mix(in srgb, var(--glass-highlight-color) ${sheenIntensity}%, transparent), transparent 55%), ${tintLayer}`
  }
  if ((material !== "burning" && material !== "particles") || strength === 0)
    return

  // Reuse the material's cells as one static background, not a canvas per control.
  const ink = /^#[\da-f]{3,8}$/i.test(color) ? color : "#3478f6"
  const seed = textureSeed("settings-controls")
  const columns = 12
  const rows = 6
  const step = 6
  const burning = createBurningTexture(ink, seed, columns, 1)
  const cells = Array.from({ length: columns * rows }, (_, index) => {
    const x = index % columns
    const y = Math.floor(index / columns)
    const fill =
      material === "burning"
        ? burning(x, y, undefined, 1, 1)
        : createParticleCell(ink, seed, x, y, columns, 1)(undefined, 1, 1, null)
            .backgroundColor
    const alpha = Number(fill.match(/([\d.]+)%, transparent/)?.[1] ?? 0)
    if (!alpha) return ""
    const opacity = Math.min(1, (alpha * strength) / 100)
    return material === "burning"
      ? `<rect x="${x * step}" y="${y * step}" width="5" height="5" opacity="${opacity}"/>`
      : `<circle cx="${x * step + 3}" cy="${y * step + 3}" r="1.6" opacity="${opacity}"/>`
  }).join("")
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${columns * step}" height="${rows * step}"><g fill="${ink}">${cells}</g></svg>`
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`
}
