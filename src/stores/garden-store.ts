import { project } from "@/lib/data/projection"
import { create } from "zustand"
import { validSharedGarden, type SharedGarden } from "@/lib/shared-garden"
export { validSharedGarden, type SharedGarden } from "@/lib/shared-garden"

export const useGardenStore = create<SharedGarden>()(
  project<SharedGarden, SharedGarden>(
    () => ({
      points: 6,
      pointsUpdatedAt: Date.now(),
      album: [],
      initialized: true,
    }),
    {
      section: "garden",
      partialize: (state) => state,
      merge: (persisted, current) =>
        validSharedGarden(persisted) ? persisted : current,
    }
  )
)

export function setGardenState(
  update:
    Partial<SharedGarden> | ((state: SharedGarden) => Partial<SharedGarden>)
) {
  useGardenStore.projection.update(update)
}
