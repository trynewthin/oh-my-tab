import { storageOptions } from "@/lib/storage"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { validSharedGarden, type SharedGarden } from "@/lib/shared-garden"
export { validSharedGarden, type SharedGarden } from "@/lib/shared-garden"

export const useGardenStore = create<SharedGarden>()(
  persist<SharedGarden>(
    () => ({
      points: 6,
      pointsUpdatedAt: Date.now(),
      album: [],
      initialized: true,
    }),
    {
      ...storageOptions<SharedGarden>(),
      name: "omt.garden",
      merge: (persisted, current) =>
        validSharedGarden(persisted) ? persisted : current,
    }
  )
)
