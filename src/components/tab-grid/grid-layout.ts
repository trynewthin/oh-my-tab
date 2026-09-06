import type { GridItem } from "./types"

export const GRID_COLUMNS = [4, 8, 12, 16, 20, 24] as const

export function columnsForWidth(width: number): number {
  if (width >= 1260) return 20
  if (width >= 1000) return 16
  return width >= 640 ? 12 : width >= 420 ? 8 : 4
}

export type GridPosition = { x: number; y: number }
export type GridPlacement = GridPosition & { height: number }
export type GridPositions = Record<string, GridPosition>

export function itemHeight(item: GridItem) {
  return item.kind === "tab"
    ? item.size === "small"
      ? 1
      : 2
    : item.size === "small"
      ? 2
      : item.size === "tall"
        ? 8
        : 4
}

function overlaps(a: GridPlacement, b: GridPlacement) {
  return (
    a.x < b.x + 4 &&
    a.x + 4 > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}

export function findVacancy(
  placed: GridPlacement[],
  columns: number,
  height = 1
): GridPlacement {
  const end = Math.max(0, ...placed.map((item) => item.y + item.height))
  for (let y = 0; y <= end; y++) {
    for (let x = 0; x <= columns - 4; x++) {
      const candidate = { x, y, height }
      if (!placed.some((item) => overlaps(candidate, item))) return candidate
    }
  }
  return { x: 0, y: end, height }
}

export function placeItems(
  items: GridItem[],
  columns: number,
  positions: GridPositions,
  target?: { id: string; position: GridPosition }
): Record<string, GridPlacement> {
  const result: Record<string, GridPlacement> = {}
  const ordered = [
    ...items.filter((item) => item.id === target?.id),
    ...items.filter((item) => item.id !== target?.id && positions[item.id]),
    ...items.filter((item) => item.id !== target?.id && !positions[item.id]),
  ]
  for (const item of ordered) {
    const saved = item.id === target?.id ? target.position : positions[item.id]
    const height = itemHeight(item)
    if (!saved) {
      result[item.id] = findVacancy(Object.values(result), columns, height)
      continue
    }
    const candidate = {
      x: Math.max(0, Math.min(columns - 4, Math.round(saved.x))),
      y: Math.max(0, Math.round(saved.y)),
      height,
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
