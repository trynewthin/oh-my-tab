import type { GridPosition } from "@/lib/grid/grid-layout"
import type { Bounds, Point } from "./model"

// Inclusive on both edges. Each axis can be inset by a fraction of its size:
// folder targeting uses an exit inset, so a retained target releases only
// once the pointer leaves.
export function containsPoint(
  point: Point,
  rect: Bounds,
  insetX = 0,
  insetY = 0
) {
  return (
    point.x >= rect.left + rect.width * insetX &&
    point.x <= rect.left + rect.width * (1 - insetX) &&
    point.y >= rect.top + rect.height * insetY &&
    point.y <= rect.top + rect.height * (1 - insetY)
  )
}

// Snaps the pointer's grid-relative offset to the nearest cell and clamps it
// into the board (x fully inside the columns, y within the 500-row ceiling).
export function gridPositionFromPoint({
  point,
  grabOffset,
  bounds,
  columns,
  columnStep,
  rowStep,
  itemWidth,
}: {
  point: Point
  grabOffset: Point
  bounds: Bounds
  columns: number
  columnStep: number
  rowStep: number
  itemWidth: number
}): GridPosition {
  return {
    x: Math.max(
      0,
      Math.min(
        columns - itemWidth,
        Math.round((point.x - grabOffset.x - bounds.left) / columnStep)
      )
    ),
    y: Math.max(
      0,
      Math.min(500, Math.round((point.y - grabOffset.y - bounds.top) / rowStep))
    ),
  }
}
