import type { GridItem } from "./types"
import { getItemGridDimensions } from "./registry"

export const GRID_COLUMNS = [4, 8, 12, 16, 20, 24] as const

export function columnsForWidth(width: number): number {
  if (width >= 1260) return 20
  if (width >= 1000) return 16
  return width >= 640 ? 12 : width > 0 ? 8 : 4
}

export type GridPosition = { x: number; y: number }
export type GridPlacement = GridPosition & { height: number; width?: number }
export type GridPositions = Record<string, GridPosition>

export function itemWidth(item: GridItem, columns = 24) {
  return getItemGridDimensions(item, columns).width
}

export function itemHeight(item: GridItem) {
  return getItemGridDimensions(item).height
}

function overlaps(a: GridPlacement, b: GridPlacement) {
  return (
    a.x < b.x + (b.width ?? 4) &&
    a.x + (a.width ?? 4) > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function findVacancy(
  placed: GridPlacement[],
  columns: number,
  height = 1,
  width = 4
): GridPlacement {
  const end = Math.max(0, ...placed.map((item) => item.y + item.height))
  for (let y = 0; y <= end; y++) {
    for (let x = 0; x <= columns - width; x++) {
      const candidate = { x, y, height, width }
      if (!placed.some((item) => overlaps(candidate, item))) return candidate
    }
  }
  return { x: 0, y: end, height, width }
}

export function placeItems(
  items: GridItem[],
  columns: number,
  positions: GridPositions,
  target?: { id: string; position: GridPosition },
  fixedIds: Iterable<string> = []
): Record<string, GridPlacement> {
  const fixed = new Set(fixedIds)
  if (target) {
    const targetItem = items.find((item) => item.id === target.id)
    if (targetItem) {
      const width = itemWidth(targetItem, columns)
      const candidate = {
        x: Math.max(
          0,
          Math.min(columns - width, Math.round(target.position.x))
        ),
        y: Math.max(0, Math.round(target.position.y)),
        width,
        height: itemHeight(targetItem),
      }
      const positioned = items
        .filter((item) => positions[item.id])
        .sort((a, b) => {
          const left = positions[a.id]
          const right = positions[b.id]
          return left.y - right.y || left.x - right.x
        })
      const current = Object.fromEntries(
        positioned.map((item) => [
          item.id,
          {
            ...positions[item.id],
            width: itemWidth(item, columns),
            height: itemHeight(item),
          },
        ])
      ) as Record<string, GridPlacement>
      const collisions = positioned.filter(
        (item) => item.id !== target.id && overlaps(candidate, current[item.id])
      )

      if (!collisions.length) {
        current[target.id] = candidate
        for (const item of items) {
          if (current[item.id]) continue
          current[item.id] = findVacancy(
            Object.values(current),
            columns,
            itemHeight(item),
            itemWidth(item, columns)
          )
        }
        return current
      }

      const originIndex = positioned.findIndex((item) => item.id === target.id)
      if (originIndex >= 0 && fixed.size === 0) {
        const destination = collisions.reduce((best, item) => {
          const placement = current[item.id]
          const bestPlacement = current[best.id]
          const area =
            Math.min(
              candidate.x + candidate.width,
              placement.x + placement.width!
            ) - Math.max(candidate.x, placement.x)
          const height =
            Math.min(
              candidate.y + candidate.height,
              placement.y + placement.height
            ) - Math.max(candidate.y, placement.y)
          const bestArea =
            Math.min(
              candidate.x + candidate.width,
              bestPlacement.x + bestPlacement.width!
            ) - Math.max(candidate.x, bestPlacement.x)
          const bestHeight =
            Math.min(
              candidate.y + candidate.height,
              bestPlacement.y + bestPlacement.height
            ) - Math.max(candidate.y, bestPlacement.y)
          return area * height > bestArea * bestHeight ? item : best
        })
        const destinationIndex = positioned.findIndex(
          (item) => item.id === destination.id
        )
        const reordered = positioned.filter((item) => item.id !== target.id)
        reordered.splice(destinationIndex, 0, targetItem)
        const collisionIndexes = collisions.map((item) =>
          positioned.findIndex((positionedItem) => positionedItem.id === item.id)
        )
        const first = Math.min(originIndex, ...collisionIndexes)
        const last = Math.max(originIndex, ...collisionIndexes)
        for (let index = first; index <= last; index++) {
          const item = reordered[index]
          current[item.id] = {
            ...positions[positioned[index].id],
            width: itemWidth(item, columns),
            height: itemHeight(item),
          }
        }
        const values = Object.values(current)
        const valid = values.every((placement, index) =>
          values.slice(index + 1).every((other) => !overlaps(placement, other))
        )
        if (valid) return current
      }
    }
  }

  const result: Record<string, GridPlacement> = {}
  const ordered = [
    ...items.filter((item) => fixed.has(item.id) && positions[item.id]),
    ...items.filter((item) => item.id === target?.id && !fixed.has(item.id)),
    ...items.filter(
      (item) =>
        item.id !== target?.id && !fixed.has(item.id) && positions[item.id]
    ),
    ...items.filter(
      (item) =>
        item.id !== target?.id && !fixed.has(item.id) && !positions[item.id]
    ),
  ]
  for (const item of ordered) {
    const saved = item.id === target?.id ? target.position : positions[item.id]
    const height = itemHeight(item)
    const width = itemWidth(item, columns)
    if (!saved) {
      result[item.id] = findVacancy(
        Object.values(result),
        columns,
        height,
        width
      )
      continue
    }
    const candidate = {
      x: Math.max(0, Math.min(columns - width, Math.round(saved.x))),
      y: Math.max(0, Math.round(saved.y)),
      height,
      width,
    }
    let collision = Object.values(result).find((placed) =>
      overlaps(candidate, placed)
    )
    while (collision) {
      candidate.y = collision.y + collision.height
      collision = Object.values(result).find((placed) =>
        overlaps(candidate, placed)
      )
    }
    result[item.id] = candidate
  }
  return result
}

export function positionsOnly(
  placements: Record<string, GridPlacement>
): GridPositions {
  return Object.fromEntries(
    Object.entries(placements).map(([id, { x, y }]) => [id, { x, y }])
  )
}

export function reconcileLayouts(
  items: GridItem[],
  layouts: Record<number, GridPositions>
) {
  return Object.fromEntries(
    Object.entries(layouts).map(([columns, positions]) => [
      columns,
      positionsOnly(placeItems(items, Number(columns), positions)),
    ])
  )
}

export function deriveLayout(
  items: GridItem[],
  columns: number,
  source: GridPositions
): GridPositions {
  const ordered = [...items].sort((a, b) => {
    const left = source[a.id]
    const right = source[b.id]
    if (!left) return right ? 1 : 0
    if (!right) return -1
    return left.y - right.y || left.x - right.x
  })
  return positionsOnly(placeItems(ordered, columns, {}))
}

export type LayoutState = {
  items: GridItem[]
  layouts: Record<number, GridPositions>
  lastLayoutColumns?: number
}

// Ensures every item has a slot for the requested column count. Derives a new
// layout from the nearest known breakpoint, and returns null when nothing
// changed so callers can skip a state update.
export function ensureLayoutColumns(
  state: LayoutState,
  columns: number
): { layouts: Record<number, GridPositions>; lastLayoutColumns: number } | null {
  const layouts = reconcileLayouts(state.items, state.layouts)
  if (!layouts[columns]) {
    const sourceColumns =
      state.lastLayoutColumns && layouts[state.lastLayoutColumns]
        ? state.lastLayoutColumns
        : Object.keys(layouts)
            .map(Number)
            .sort((a, b) => Math.abs(a - columns) - Math.abs(b - columns))[0]
    layouts[columns] = deriveLayout(
      state.items,
      columns,
      sourceColumns ? layouts[sourceColumns] : {}
    )
  }
  const unchanged =
    Object.keys(layouts).length === Object.keys(state.layouts).length &&
    Object.entries(layouts).every(([key, layout]) => {
      const old = state.layouts[Number(key)]
      return (
        old &&
        Object.keys(layout).length === Object.keys(old).length &&
        Object.entries(layout).every(
          ([id, position]) =>
            old[id]?.x === position.x && old[id]?.y === position.y
        )
      )
    })
  return unchanged && state.lastLayoutColumns === columns
    ? null
    : { layouts, lastLayoutColumns: columns }
}
