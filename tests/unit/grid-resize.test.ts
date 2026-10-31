import { expect, test } from "vitest"
import {
  createCatalogComponent,
  createFolderItem,
  createTabItem,
} from "@/lib/grid/factory"
import { resolveResizeSize } from "@/lib/grid/resize"
import { resizeItem } from "@/lib/grid/operations"
import { placeItems, positionsOnly } from "@/lib/grid/grid-layout"
import { validGridItem } from "@/lib/grid/validation"

test("tab resizing snaps at midpoint and keeps the current size on ties", () => {
  const tab = createTabItem({ name: "Tab", url: "https://example.com" })
  expect(resolveResizeSize(tab, 8, 4, 1.49)).toBe("small")
  expect(resolveResizeSize(tab, 8, 4, 1.5)).toBe("small")
  expect(resolveResizeSize(tab, 8, 4, 1.51)).toBe("medium")
  expect(resolveResizeSize({ ...tab, size: "medium" }, 8, 4, 1.5)).toBe(
    "medium"
  )
})

test.each([
  [1, "square-small"],
  [2, "square-medium"],
  [4, "square-large"],
] as const)("tab resizing reaches a square with side %s", (side, size) => {
  const tab = createTabItem({ name: "Tab", url: "https://example.com" })
  expect(resolveResizeSize(tab, 8, side, side)).toBe(size)
  expect(resolveResizeSize({ ...tab, size }, 8, 4, 1)).toBe("small")
  expect(resolveResizeSize({ ...tab, size }, 8, 4, 2)).toBe("medium")
})

test("folder resizing follows both axes and excludes sizes wider than the grid", () => {
  const folder = createFolderItem({ name: "Folder" })
  expect(resolveResizeSize(folder, 8, 8, 4)).toBe("wide")
  expect(resolveResizeSize(folder, 8, 4, 8)).toBe("tall")
  expect(resolveResizeSize(folder, 8, 8, 8)).toBe("wide-tall")
  expect(resolveResizeSize(folder, 4, 8, 8)).toBe("tall")
  expect(resolveResizeSize(folder, 8, -10, -10)).toBe("large")
})

test("folder 4x2 remains readable but cannot be selected by resizing", () => {
  const folder = createFolderItem({ name: "Folder" })
  const legacy = { ...folder, size: "small" as const }
  expect(validGridItem(legacy)).toBe(true)
  expect(resizeItem([folder], folder.id, "small")).toEqual([folder])
  expect(resolveResizeSize(legacy, 8, 4, 2)).toBe("large")
})

test("drag resizing holds its current size near a boundary to avoid flickering", () => {
  const tab = createTabItem({ name: "Tab", url: "https://example.com" })
  expect(
    resolveResizeSize(tab, 8, 4, 1.6, {
      currentSize: "small",
      hysteresis: 0.12,
    })
  ).toBe("small")
  expect(
    resolveResizeSize(tab, 8, 4, 1.65, {
      currentSize: "small",
      hysteresis: 0.12,
    })
  ).toBe("medium")
  expect(
    resolveResizeSize(tab, 8, 4, 1.4, {
      currentSize: "medium",
      hysteresis: 0.12,
    })
  ).toBe("medium")
  expect(
    resolveResizeSize(tab, 8, 4, 1.35, {
      currentSize: "medium",
      hysteresis: 0.12,
    })
  ).toBe("small")
})

test("resizing pushes neighboring tiles without losing contents or overlapping placements", () => {
  const folder = createFolderItem({ name: "Folder" })
  const tab = createTabItem({ name: "Tab", url: "https://example.com" })
  const positions = { [folder.id]: { x: 0, y: 0 }, [tab.id]: { x: 4, y: 0 } }
  const items = resizeItem([folder, tab], folder.id, "wide")
  const placements = placeItems(
    items,
    8,
    positions,
    {
      id: folder.id,
      position: positions[folder.id],
    },
    [folder.id]
  )
  expect(placements[folder.id]).toMatchObject({
    x: 0,
    y: 0,
    width: 8,
    height: 4,
  })
  expect(placements[tab.id].y).toBeGreaterThanOrEqual(4)
  expect(items[0]).toEqual({ ...folder, size: "wide" })
  expect(items[1]).toEqual(tab)
  expect(placeItems(items, 8, positionsOnly(placements))).toEqual(placements)
})

test("todo rejects retired smaller sizes while preserving its tasks", () => {
  const item = {
    ...createCatalogComponent("todo"),
    tasks: [{ id: "task", text: "KEEP", done: true }],
  }
  const [resized] = resizeItem([item], item.id, "small")
  expect(resized).toEqual(item)
})

test("canvas resizing preserves off-canvas artwork and expands its drawing area", () => {
  const item = createCatalogComponent("dot-canvas", "wide")
  if (item.kind !== "dot-canvas") throw new Error("Expected canvas")
  item.pixels[47] = "#123456"
  const [small] = resizeItem([item], item.id, "large")
  expect(small).toMatchObject({
    size: "large",
    pixelColumns: 48,
    pixels: item.pixels,
  })
  const [tall] = resizeItem([small], item.id, "tall")
  if (tall.kind !== "dot-canvas") throw new Error("Expected canvas")
  expect(tall.pixelColumns).toBe(48)
  expect(tall.pixels).toHaveLength(48 * 48)
  expect(tall.pixels[47]).toBe("#123456")
})
