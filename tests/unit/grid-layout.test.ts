import { describe, expect, test } from "vitest"
import {
  GRID_CELL_SIZE,
  GRID_GAP,
  gridOccupancyBox,
  gridTrackWidth,
  MIN_COMFORTABLE_GRID_SCALE,
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
    expect(gridOccupancyBox(1280, 4, 1)).toEqual({
      width: 4 * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP,
      height: GRID_CELL_SIZE,
    })
    expect(gridTrackWidth(16)).toBe(1192)
  })

  test("the wide layout scales to 80 percent before switching", () => {
    const wideTrackWidth = gridTrackWidth(16)
    const comfortable = resolveGridGeometry(
      wideTrackWidth * MIN_COMFORTABLE_GRID_SCALE,
      4,
      2
    )
    expect(comfortable.componentColumns).toBe(4)
    expect(comfortable.scale).toBeCloseTo(MIN_COMFORTABLE_GRID_SCALE)

    const switched = resolveGridGeometry(
      wideTrackWidth * MIN_COMFORTABLE_GRID_SCALE - 1,
      4,
      2
    )
    expect(switched.componentColumns).toBe(2)
    expect(switched.metrics.columns).toBe(8)
    expect(switched.scale).toBe(1)
  })

  test("configured column counts drive wide and narrow layouts", () => {
    const wide = resolveGridGeometry(1200, 5, 3)
    expect(wide.componentColumns).toBe(5)
    expect(wide.metrics.columns).toBe(20)

    const narrow = resolveGridGeometry(1190, 5, 3)
    expect(narrow.componentColumns).toBe(3)
    expect(narrow.metrics.columns).toBe(12)
    expect(narrow.trackWidth).toBe(890)

    const tiny = resolveGridGeometry(320, 5, 3)
    expect(tiny.componentColumns).toBe(3)
    expect(tiny.visualWidth).toBeCloseTo(320)
    expect(tiny.scale).toBeCloseTo(320 / 890)
  })

  test("defaults use four wide columns and two narrow columns", () => {
    const wide = resolveGridGeometry(1000)
    expect(wide.metrics.columns).toBe(16)
    expect(wide.trackWidth).toBe(1192)
    expect(wide.scale).toBeCloseTo(1000 / 1192)

    const narrow = resolveGridGeometry(900)
    expect(narrow.metrics.columns).toBe(8)
    expect(narrow.trackWidth).toBe(588)
    expect(narrow.scale).toBe(1)
  })
})
