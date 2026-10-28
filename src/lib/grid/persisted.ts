import { i18n } from "@/i18n"
import type { GridItem } from "./types"
import { validGridItem } from "./validation"
import {
  GRID_COLUMNS,
  itemWidth,
  type GridPosition,
  type GridPositions,
} from "./grid-layout"
export function sanitizePersisted(persisted: unknown): {
  items: GridItem[]
  layouts: Record<number, GridPositions>
  mockDataVersion: number
} {
  const items = (persisted as { items?: unknown } | null)?.items
  if (
    items !== undefined &&
    (!Array.isArray(items) || !items.every(validGridItem))
  ) {
    throw new Error(i18n.t("grid.error.corruptGrid"))
  }
  const storedItems: GridItem[] = Array.isArray(items) ? items : []
  const savedLayouts = (
    persisted as { layouts?: Record<string, unknown> } | null
  )?.layouts
  const layouts: Record<number, GridPositions> = {}
  for (const columns of GRID_COLUMNS) {
    const layout = savedLayouts?.[columns]
    if (!layout || typeof layout !== "object") continue
    layouts[columns] = Object.fromEntries(
      Object.entries(layout).filter(([id, value]) => {
        if (
          !value ||
          !Number.isInteger((value as GridPosition).x) ||
          !Number.isInteger((value as GridPosition).y)
        )
          return false
        const { x, y } = value as GridPosition
        const item = storedItems.find((entry) => entry.id === id)
        const width = item ? itemWidth(item, columns) : 4
        return x >= 0 && x <= columns - width && y >= 0 && y <= 500
      })
    )
  }
  const mockDataVersion =
    (persisted as { mockDataVersion?: number } | null)?.mockDataVersion ?? 0
  return {
    items: storedItems,
    layouts,
    mockDataVersion,
  }
}
