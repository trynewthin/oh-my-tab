import type { MaterialStyle } from "@/components/effects/material-surface"

export const materialPlacements = ["background", "card", "control"] as const
export type MaterialPlacement = (typeof materialPlacements)[number]
export type MaterialAssignments = Record<MaterialPlacement, MaterialStyle>

export const materialOptions: Record<
  MaterialStyle,
  { labelKey: string; placements: readonly MaterialPlacement[] }
> = {
  burning: {
    labelKey: "settings.effects.burning",
    placements: materialPlacements,
  },
  particles: {
    labelKey: "settings.effects.particles",
    placements: materialPlacements,
  },
  "star-trails": {
    labelKey: "settings.effects.starTrails",
    placements: ["background", "card"],
  },
  "fair-isle": {
    labelKey: "settings.effects.fairIsle",
    placements: ["background", "card"],
  },
  "liquid-glass": {
    labelKey: "settings.effects.liquidGlass",
    placements: ["card", "control"],
  },
  none: {
    labelKey: "settings.effects.none",
    placements: materialPlacements,
  },
}

export const materialStyles = Object.keys(materialOptions) as MaterialStyle[]
