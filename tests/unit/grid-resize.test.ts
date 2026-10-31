import { expect, test } from "vitest"
import { createFolderItem, createTabItem } from "@/lib/grid/factory"
import { resolveResizeSize } from "@/lib/grid/resize"
import { resizeItem } from "@/lib/grid/operations"
import { placeItems, positionsOnly } from "@/lib/grid/grid-layout"

test("tab resizing snaps at midpoint and keeps the current size on ties", () => {
  const tab = createTabItem({ name: "Tab", url: "https://example.com" })
  expect(resolveResizeSize(tab, 8, 4, 1.49)).toBe("small")
  expect(resolveResizeSize(tab, 8, 4, 1.5)).toBe("small")
  expect(resolveResizeSize(tab, 8, 4, 1.51)).toBe("medium")
  expect(resolveResizeSize({ ...tab, size: "medium" }, 8, 4, 1.5)).toBe(
    "medium"
  )
})

test("folder resizing follows both axes and excludes sizes wider than the grid", () => {
  const folder = createFolderItem({ name: "Folder" })
  expect(resolveResizeSize(folder, 8, 8, 4)).toBe("wide")
  expect(resolveResizeSize(folder, 8, 4, 8)).toBe("tall")
  expect(resolveResizeSize(folder, 8, 8, 8)).toBe("wide-tall")
  expect(resolveResizeSize(folder, 4, 8, 8)).toBe("tall")
  expect(resolveResizeSize(folder, 8, -10, -10)).toBe("large")
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
