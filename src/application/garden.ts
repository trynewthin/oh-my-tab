import { dispatchProjectedCommand } from "@/lib/data/projection"
import type { EcosystemItem } from "@/lib/grid/types"
import { useGardenStore } from "@/stores/garden-store"
import { useTabGridStore } from "@/stores/tab-grid-store"

export async function saveGardenWidget(next: EcosystemItem) {
  try {
    await dispatchProjectedCommand(
      {
        type: "garden.update-widget",
        garden: {
          ...useGardenStore.getState(),
          points: next.points!,
          pointsUpdatedAt: next.pointsUpdatedAt!,
          album: next.album ?? [],
          lastCheckIn: next.lastCheckIn,
          initialized: true,
        },
        widget: {
          id: next.id,
          kind: next.kind,
          name: next.name,
          size: next.size,
          color: next.color,
          species: next.species,
          plants: next.plants,
        },
      },
      {
        garden: useGardenStore.projection.source(),
        grid: useTabGridStore.projection.source(),
      }
    )
  } finally {
    await Promise.all([
      useGardenStore.projection.rehydrate(),
      useTabGridStore.projection.rehydrate(),
    ])
  }
}
