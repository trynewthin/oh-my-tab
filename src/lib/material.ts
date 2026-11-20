export const materialStyles = [
  "burning",
  "particles",
  "star-trails",
  "fair-isle",
  "liquid-glass",
  "none",
] as const
export type MaterialStyle = (typeof materialStyles)[number]

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

export function supportsMaterial(
  style: MaterialStyle,
  placement: MaterialPlacement
) {
  return materialOptions[style].placements.includes(placement)
}
