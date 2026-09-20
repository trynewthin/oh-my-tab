import {
  findVacancy,
  itemHeight,
  itemWidth,
  positionsOnly,
  type GridPlacement,
  type GridPosition,
  type GridPositions,
} from "@/lib/grid/grid-layout"
import type { GridItem } from "@/lib/grid/types"

// Preview drops resolve by re-homing overlapped tiles into freed cells, and
// when that cannot fit the fixed area, by reflowing every tile in reading
// order. A drop that still overflows is rejected — the caller keeps the
// settled layout so tiles spring back instead of clipping out of view.
export function resolvePreviewDrop(
  items: GridItem[],
  columns: number,
  rows: number | undefined,
  positions: GridPositions,
  target: { id: string; position: GridPosition }
): GridPositions | null {
  const item = items.find((entry) => entry.id === target.id)
  if (!item) return null
  const width = itemWidth(item, columns)
  const height = itemHeight(item)
  const targetPlacement: GridPlacement = {
    x: Math.max(0, Math.min(columns - width, Math.round(target.position.x))),
    y: Math.max(
      0,
      Math.min(
        Math.max(0, (rows ?? height) - height),
        Math.round(target.position.y)
      )
    ),
    width,
    height,
  }
  const ordered = items
    .filter((entry) => positions[entry.id])
    .sort(
      (a, b) =>
        positions[a.id].y - positions[b.id].y ||
        positions[a.id].x - positions[b.id].x
    )
  const placementOf = (entry: GridItem): GridPlacement => ({
    ...(positions[entry.id] ?? { x: 0, y: 0 }),
    width: itemWidth(entry, columns),
    height: itemHeight(entry),
  })
  const displaced = ordered.filter(
    (entry) =>
      entry.id !== item.id &&
      placementsOverlap(targetPlacement, placementOf(entry))
  )
  const next: Record<string, GridPlacement> = { [item.id]: targetPlacement }
  for (const entry of ordered) {
    if (entry.id === item.id || displaced.includes(entry)) continue
    next[entry.id] = placementOf(entry)
  }
  const fits = (p: GridPlacement) =>
    rows === undefined || (p.y + p.height <= rows && p.x + p.width <= columns)
  let passOk = true
  for (const entry of displaced) {
    const free = findVacancy(
      Object.values(next),
      columns,
      itemHeight(entry),
      itemWidth(entry, columns)
    )
    if (!fits(free)) {
      passOk = false
      break
    }
    next[entry.id] = free
  }
  if (passOk) return positionsOnly(next)

  const reflowed: Record<string, GridPlacement> = {
    [item.id]: targetPlacement,
  }
  for (const entry of ordered) {
    if (entry.id === item.id) continue
    const free = findVacancy(
      Object.values(reflowed),
      columns,
      itemHeight(entry),
      itemWidth(entry, columns)
    )
    if (!fits(free)) return null
    reflowed[entry.id] = free
  }
  return positionsOnly(reflowed)
}

function placementsOverlap(a: GridPlacement, b: GridPlacement) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  )
}
