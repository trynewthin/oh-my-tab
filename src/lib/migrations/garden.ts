import type { GardenPlant, GridItem } from "@/lib/grid/types"
import { plantSeed, settleGarden } from "@/lib/garden"
import type { SharedGarden } from "@/lib/shared-garden"

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
