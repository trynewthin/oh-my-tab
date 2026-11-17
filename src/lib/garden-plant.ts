import type { GardenPlant } from "@/lib/grid/types"

export function validGardenPlant(value: unknown): value is GardenPlant {
  if (!value || typeof value !== "object") return false
  const p = value as GardenPlant
  return (
    (p.appearance === "classic" || p.appearance === "varied") &&
    Number.isInteger(p.slot) &&
    p.slot >= 0 &&
    p.slot < 8 &&
    Number.isFinite(p.plantedAt) &&
    p.plantedAt >= 0 &&
    ["flowers", "ferns"].includes(p.species) &&
    Number.isInteger(p.seed) &&
    p.seed >= 0 &&
    p.seed <= 4294967295 &&
    (p.name === undefined ||
      (typeof p.name === "string" && p.name.length <= 40)) &&
    (p.boost === undefined || (Number.isFinite(p.boost) && p.boost >= 0)) &&
    (p.rewardedLevel === undefined ||
      (Number.isInteger(p.rewardedLevel) &&
        p.rewardedLevel >= 0 &&
        p.rewardedLevel <= 4))
  )
}
