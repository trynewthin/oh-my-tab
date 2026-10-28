import type { GardenPlant } from "@/lib/grid/types"
import { validGardenPlant } from "@/lib/garden"

export type SharedGarden = {
  points: number
  pointsUpdatedAt: number
  album: GardenPlant[]
  lastCheckIn?: string
  initialized: boolean
}
export function validSharedGarden(value: unknown): value is SharedGarden {
  if (!value || typeof value !== "object") return false
  const garden = value as SharedGarden
  return (
    Number.isInteger(garden.points) &&
    garden.points >= 0 &&
    Number.isFinite(garden.pointsUpdatedAt) &&
    garden.pointsUpdatedAt >= 0 &&
    Array.isArray(garden.album) &&
    garden.album.every(validGardenPlant) &&
    typeof garden.initialized === "boolean" &&
    (garden.lastCheckIn === undefined ||
      (typeof garden.lastCheckIn === "string" &&
        /^\d{4}-\d{2}-\d{2}$/.test(garden.lastCheckIn)))
  )
}
