import { describe, expect, test } from "vitest"
import {
  columnsForWidth,
  GRID_CELL_SIZE,
  GRID_GAP,
  gridMetrics,
  gridOccupancyBox,
  placeItems,
  resolveGridGeometry,
} from "@/lib/grid/grid-layout"
import type { GridItem, TemplateItem } from "@/lib/grid/types"

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

describe("responsive component width", () => {
  test("search components use 12 columns when available and shrink to the grid", () => {
    const minimal: GridItem = {
      id: "minimal-search",
      kind: "search-minimal",
      name: "search",
      size: "small",
      color: "#6c8bd4",
    }
    const full: GridItem = {
      id: "full-search",
      kind: "search-full",
      name: "search",
      size: "medium",
      color: "#6c8bd4",
    }
    expect(placeItems([minimal, full], 20, {})).toMatchObject({
      "minimal-search": { width: 12, height: 1 },
      "full-search": { width: 12, height: 2 },
    })
    expect(placeItems([minimal, full], 8, {})).toMatchObject({
      "minimal-search": { width: 8, height: 1 },
      "full-search": { width: 8, height: 2 },
    })
  })
})

describe("grid metrics", () => {
  test("cell size matches home grid geometry", () => {
    const metrics = gridMetrics(1280)
    expect(metrics.columns).toBe(16)
    expect(metrics.gap).toBe(GRID_GAP)
    expect(metrics.columnStep).toBe(GRID_CELL_SIZE + GRID_GAP)
    expect(metrics.rowSize).toBe(GRID_CELL_SIZE)
    expect(gridOccupancyBox(1280, 4, 1)).toEqual({
      width: 4 * metrics.columnStep - GRID_GAP,
      height: GRID_CELL_SIZE,
    })
  })

  test("cell size remains fixed while the column count changes", () => {
    for (const width of [500, 900, 1280, 1920]) {
      const metrics = gridMetrics(width)
      expect(metrics.rowSize).toBe(GRID_CELL_SIZE)
      expect(metrics.columnStep).toBe(GRID_CELL_SIZE + GRID_GAP)
    }
  })

  test("home grids keep at least two four-unit component columns", () => {
    expect(columnsForWidth(320)).toBe(8)
    expect(columnsForWidth(320, "even-components")).toBe(8)
  })

  test("free grids expose only an even number of four-unit component columns", () => {
    for (const [width, columns] of [
      [500, 8],
      [900, 8],
      [1440, 16],
      [1920, 24],
    ] as const) {
      expect(columnsForWidth(width, "even-components")).toBe(columns)
      expect(columns / 4).toBeGreaterThan(0)
      expect((columns / 4) % 2).toBe(0)
    }
  })

  test("static grids keep four desktop component columns and two mobile columns", () => {
    const desktop = resolveGridGeometry(900, "static", false)
    expect(desktop.metrics.columns).toBe(16)
    expect(desktop.trackWidth).toBe(1192)
    expect(desktop.visualWidth).toBe(900)
    expect(desktop.scale).toBeCloseTo(900 / 1192)

    const mobile = resolveGridGeometry(320, "static", true)
    expect(mobile.metrics.columns).toBe(8)
    expect(mobile.trackWidth).toBe(588)
    expect(mobile.visualWidth).toBeCloseTo(320)
    expect(mobile.scale).toBeCloseTo(320 / 588)

    const narrow = resolveGridGeometry(240, "static", true)
    expect(narrow.visualWidth).toBe(240)
    expect(narrow.scale).toBeCloseTo(240 / 588)
  })
})
