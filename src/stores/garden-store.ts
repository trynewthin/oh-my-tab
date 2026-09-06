import { create } from "zustand"
import { persist } from "zustand/middleware"
import type { GardenPlant, GridItem } from "@/components/tab-grid/types"
import { plantSeed, settleGarden, validGardenPlant } from "@/lib/garden"

export type SharedGarden = {
  points: number
  pointsUpdatedAt: number
  album: GardenPlant[]
  lastCheckIn?: string
  initialized: boolean
}
export function migrateGarden(items: GridItem[], now: number): SharedGarden {
  const pots = items.filter((item) => item.kind === "ecosystem")
  const album = new Map<string, GardenPlant>()
  let points = pots.length ? 0 : 6
  let lastCheckIn: string | undefined
  for (const pot of pots) {
    const settled = settleGarden(pot, now)
    points += settled.points!
    for (const plant of pot.album ?? [])
      album.set(`${plantSeed(plant)}-${plant.plantedAt}`, plant)
    if (pot.lastCheckIn && (!lastCheckIn || pot.lastCheckIn > lastCheckIn))
      lastCheckIn = pot.lastCheckIn
  }
  return {
    points,
    pointsUpdatedAt: now,
    album: [...album.values()],
    lastCheckIn,
    initialized: true,
  }
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
export const useGardenStore = create<SharedGarden>()(
  persist<SharedGarden>(
    () => ({
      points: 6,
      pointsUpdatedAt: Date.now(),
      album: [],
      initialized: false,
    }),
    {
      name: "omt.garden",
      merge: (persisted, current) =>
        validSharedGarden(persisted) ? persisted : current,
    }
  )
)
export function initializeGarden(items: GridItem[]) {
  if (!useGardenStore.getState().initialized)
    useGardenStore.setState(migrateGarden(items, Date.now()))
}
