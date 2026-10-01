import { describe, expect, test } from "vitest"
import { fitPreview } from "@/lib/preview-fit"
import { rovingIndex } from "@/lib/roving-index"
import { bookmarkHost } from "@/lib/bookmark-display"
import { componentRegistry } from "@/lib/grid/registry"
import { GRID_CELL_SIZE, GRID_GAP } from "@/lib/grid/grid-layout"

describe("unobstructed widget preview", () => {
  test("fits every registered occupancy without cropping or changing its ratio", () => {
    for (const definition of Object.values(componentRegistry)) {
      for (const size of definition.sizes) {
        const content = {
          width: size.width * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP,
          height: size.height * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP,
        }
        for (const stage of [
          { width: 168, height: 144 },
          { width: 300, height: 220 },
          { width: 480, height: 400 },
        ]) {
          const fitted = fitPreview(content, stage)
          expect(fitted.scale).toBeGreaterThan(0)
          expect(fitted.scale).toBeLessThanOrEqual(1)
          expect(fitted.width).toBeLessThanOrEqual(stage.width + 0.001)
          expect(fitted.height).toBeLessThanOrEqual(stage.height + 0.001)
          expect(fitted.width / fitted.height).toBeCloseTo(
            content.width / content.height
          )
        }
      }
    }
  })

  test("does not enlarge a small widget or exceed the current home scale", () => {
    expect(
      fitPreview({ width: 100, height: 50 }, { width: 500, height: 500 })
    ).toEqual({ width: 100, height: 50, scale: 1 })
    expect(
      fitPreview({ width: 100, height: 50 }, { width: 500, height: 500 }, 0.6)
    ).toEqual({ width: 60, height: 30, scale: 0.6 })
  })

  test.each([0, -1, Number.NaN, Number.POSITIVE_INFINITY])(
    "handles an unmeasured or invalid stage (%s)",
    (value) => {
      expect(
        fitPreview({ width: 100, height: 100 }, { width: value, height: 200 })
      ).toEqual({ width: 0, height: 0, scale: 0 })
      expect(
        fitPreview({ width: value, height: 100 }, { width: 200, height: 200 })
      ).toEqual({ width: 0, height: 0, scale: 0 })
    }
  )
})

describe("spatial keyboard navigation", () => {
  test.each([
    ["ArrowRight", 2, 0],
    ["ArrowLeft", 0, 2],
    ["Home", 1, 0],
    ["End", 0, 2],
  ] as const)("%s moves from %s to %s", (key, from, to) => {
    expect(rovingIndex(key, from, 3)).toBe(to)
  })

  test("leaves vertical page navigation alone in the toolbar", () => {
    expect(rovingIndex("ArrowDown", 0, 3)).toBeNull()
    expect(rovingIndex("ArrowUp", 0, 3)).toBeNull()
    expect(rovingIndex("ArrowDown", 0, 3, true)).toBe(1)
    expect(rovingIndex("ArrowUp", 0, 3, true)).toBe(2)
  })

  test("does not intercept Tab, Escape or an unfocused/empty toolbar", () => {
    for (const key of ["Tab", "Escape", "Enter", "a"])
      expect(rovingIndex(key, 0, 3, true)).toBeNull()
    expect(rovingIndex("ArrowRight", -1, 3)).toBeNull()
    expect(rovingIndex("ArrowRight", 0, 0)).toBeNull()
  })
})

describe("secondary bookmark label", () => {
  test("shows the domain and port, not credentials, private paths or queries", () => {
    expect(
      bookmarkHost(
        "https://alice:secret@www.example.org:8443/private?token=secret#item"
      )
    ).toBe("example.org:8443")
    expect(bookmarkHost("https://docs.example.org/guide")).toBe(
      "docs.example.org"
    )
  })

  test.each(["", "not a URL", "javascript:alert(1)", "data:text/plain,hello"])(
    "does not render a host for %s",
    (url) => {
      expect(bookmarkHost(url)).toBe("")
    }
  )
})
