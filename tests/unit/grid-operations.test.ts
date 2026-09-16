import { describe, expect, it } from "vitest"
import {
  groupComponents,
  resolveGroupAction,
} from "@/lib/grid/grid-operations"
import type { GridItem, TabItem, FolderItem } from "@/lib/grid/types"
import type { GridPositions } from "@/lib/grid/grid-layout"

let seq = 0
const tab = (over: Partial<TabItem> = {}): TabItem => ({
  id: `t${++seq}`,
  kind: "tab",
  name: `tab${seq}`,
  url: `https://e${seq}.example/`,
  size: "small",
  color: "#6c8bd4",
  ...over,
})
const folder = (over: Partial<FolderItem> = {}): FolderItem => ({
  id: `f${++seq}`,
  kind: "folder",
  name: `folder${seq}`,
  size: "large",
  color: "#6c8bd4",
  tabs: [],
  ...over,
})
const data = (
  items: GridItem[],
  layouts: Record<number, GridPositions> = {}
) => ({
  items,
  layouts,
  lastLayoutColumns: 24,
})

describe("resolveGroupAction", () => {
  it("requires at least two groupable items", () => {
    expect(resolveGroupAction([tab()]).kind).toBe("disabled")
    expect(resolveGroupAction([tab(), tab()]).kind).toBe("create")
  })

  it("moves tabs into an existing folder when one is selected", () => {
    const f = folder()
    const t = tab()
    expect(resolveGroupAction([f, t])).toEqual({ kind: "move", folderId: f.id })
  })

  it("creates a new folder for multiple folders or tab-only selection", () => {
    expect(resolveGroupAction([folder(), folder()]).kind).toBe("create")
    expect(resolveGroupAction([tab(), tab(), tab()]).kind).toBe("create")
  })

  it("refuses non-groupable widgets", () => {
    const cal = {
      id: "c1",
      kind: "calendar",
      name: "日历",
      size: "large",
      color: "#3478f6",
      month: { year: 2024, month: 1 },
    } as GridItem
    expect(resolveGroupAction([tab(), cal]).kind).toBe("disabled")
  })
})

describe("groupComponents", () => {
  it("moves tabs into a folder and clears their grid slots", () => {
    const f = folder({ tabs: [] })
    const [a, b] = [tab(), tab()]
    const before = data([f, a, b], {
      24: {
        [f.id]: { x: 0, y: 0 },
        [a.id]: { x: 4, y: 0 },
        [b.id]: { x: 8, y: 0 },
      },
    })
    const next = groupComponents(before, [f.id, a.id, b.id])
    expect(next).not.toBeNull()
    const merged = next!.items.find((i) => i.id === f.id)
    expect(merged?.kind).toBe("folder")
    expect((merged as FolderItem).tabs.map((t) => t.id)).toEqual([a.id, b.id])
    expect(next!.items).toHaveLength(1)
    expect(next!.layouts[24][a.id]).toBeUndefined()
    expect(next!.layouts[24][b.id]).toBeUndefined()
    expect(next!.layouts[24][f.id]).toBeDefined()
  })

  it("creates a folder at the first selected item's position", () => {
    const [a, b] = [tab(), tab()]
    const before = data([a, b], {
      24: { [a.id]: { x: 8, y: 3 }, [b.id]: { x: 0, y: 0 } },
    })
    const next = groupComponents(before, [a.id, b.id], "工作")
    expect(next).not.toBeNull()
    const created = next!.items.find((i) => i.kind === "folder")
    expect(created?.name).toBe("工作")
    // Sorted by layout order: b (0,0) precedes a (8,3)
    expect(next!.layouts[24][created!.id]).toEqual({ x: 0, y: 0 })
    expect((created as FolderItem).tabs.map((t) => t.id)).toEqual([b.id, a.id])
  })

  it("returns null when name is empty or selection is invalid", () => {
    const [a, b] = [tab(), tab()]
    const before = data([a, b])
    expect(groupComponents(before, [a.id, b.id], "  ")).toBeNull()
    expect(groupComponents(before, [a.id])).toBeNull()
  })
})
