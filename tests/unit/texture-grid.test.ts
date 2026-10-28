import { describe, expect, test } from "vitest"
import {
  textureGrid,
  TEXTURE_CELL_SIZE,
  TEXTURE_GAP,
  TEXTURE_STEP,
} from "@/components/effects/texture-grid"

describe("texture grid geometry", () => {
  test("folder borders change the last row, never the first row origin or cell pitch", () => {
    const bordered = textureGrid(152, 44)
    const overlay = textureGrid(154, 46)
    expect(bordered.rows).toBe(5)
    expect(overlay.rows).toBe(6)
    expect(bordered.top).toBe(0)
    expect(overlay.top).toBe(0)
    expect((overlay.rows - 1) * TEXTURE_STEP).toBe(45)
  })

  test("ordinary tabs cover the bottom without stretching cells or shifting the top", () => {
    for (const height of [8, 9, 10, 37, 44, 46, 55, 98.5, 104, 143.75, 217]) {
      for (const border of [0, 1, 3, 8]) {
        const innerHeight = Math.max(0, height - border * 2)
        const grid = textureGrid(237.875, innerHeight)
        expect(grid.top).toBe(0)
        if (!innerHeight) {
          expect(grid.rows).toBe(0)
          continue
        }
        const lastTop = (grid.rows - 1) * TEXTURE_STEP
        const bottom = lastTop + TEXTURE_CELL_SIZE
        expect(lastTop).toBeLessThan(innerHeight)
        // Only the normal inter-cell gap may reach the bottom edge.
        expect(bottom).toBeGreaterThanOrEqual(innerHeight - TEXTURE_GAP)
        expect(bottom - innerHeight).toBeLessThan(TEXTURE_CELL_SIZE)
        expect(grid.left).toBeGreaterThanOrEqual(0)
        expect(
          grid.left + grid.columns * TEXTURE_STEP - TEXTURE_GAP
        ).toBeCloseTo(grid.width)
      }
    }
  })

  test("narrow regions omit partial columns while short regions clip their first row", () => {
    expect(textureGrid(7.99, 20).columns).toBe(0)
    expect(textureGrid(20, 7.99).rows).toBe(1)
    expect(textureGrid(8, 8)).toMatchObject({
      columns: 1,
      rows: 1,
      top: 0,
      left: 0,
    })
    expect(textureGrid(16.9, 16.9)).toMatchObject({ columns: 1, rows: 2 })
    expect(textureGrid(17, 17)).toMatchObject({ columns: 2, rows: 2 })
  })
})
