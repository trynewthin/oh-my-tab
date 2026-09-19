import { describe, expect, test } from "vitest"
import {
  gridMetrics,
  gridOccupancyBox,
  placeItems,
} from "@/lib/grid/grid-layout"
import type { TemplateItem } from "@/lib/grid/types"

const template = (id: string, size: TemplateItem["size"]): TemplateItem => ({
  id,
  kind: "template",
  name: id,
  color: "#8a90a0",
  size,
})

describe("grid unit occupancy", () => {
  test("1×1 tiles pack side by side on the unit grid", () => {
    const placed = placeItems(
      [template("a", "small"), template("b", "small")],
      8,
      {}
    )
    expect(placed.a).toEqual({ x: 0, y: 0, width: 1, height: 1 })
    expect(placed.b).toEqual({ x: 1, y: 0, width: 1, height: 1 })
  })

  test("2×2 and 4×1 occupy integer multiples of the unit square", () => {
    const placed = placeItems(
      [template("square", "medium"), template("bar", "wide")],
      8,
      {}
    )
    expect(placed.square).toEqual({ x: 0, y: 0, width: 2, height: 2 })
    expect(placed.bar).toEqual({ x: 2, y: 0, width: 4, height: 1 })
  })
})

describe("grid metrics", () => {
  test("cell size matches home grid geometry", () => {
    const metrics = gridMetrics(1280)
    expect(metrics.columns).toBe(20)
    expect(metrics.gap).toBe(16)
    expect(metrics.columnStep).toBe((1280 + 16) / 20)
    expect(metrics.rowSize).toBe(metrics.columnStep - 16)
    expect(gridOccupancyBox(1280, 4, 1)).toEqual({
      width: 4 * metrics.columnStep - 16,
      height: metrics.columnStep - 16,
    })
  })
})
