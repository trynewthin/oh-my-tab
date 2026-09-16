import { describe, expect, it } from "vitest"
import { transferTab } from "@/components/tab-grid/model/tab-transfer"
import type { GridItem, TabItem, FolderItem } from "@/components/tab-grid/types"

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
const state = (
  items: GridItem[],
  layouts = {} as Record<number, Record<string, { x: number; y: number }>>
) => ({
  items,
  layouts,
})

describe("transferTab", () => {
  it("moves a grid tab into a folder and drops its layout slot", () => {
    const f = folder()
    const t = tab()
    const before = state([f, t], { 24: { [t.id]: { x: 0, y: 0 } } })
    const next = transferTab(before, {
      tabId: t.id,
      toFolderId: f.id,
      columns: 24,
    })
    const target = next.items.find((i) => i.id === f.id) as FolderItem
    expect(target.tabs.map((e) => e.id)).toEqual([t.id])
    expect(next.items.find((i) => i.id === t.id)).toBeUndefined()
    expect(next.layouts[24][t.id]).toBeUndefined()
  })

  it("moves a folder tab back to the grid and places it", () => {
    const inner = {
      id: "inner1",
      name: "in",
      url: "https://in.example/",
    }
    const f = folder({ tabs: [inner] })
    const before = state([f], { 24: { [f.id]: { x: 0, y: 0 } } })
    const next = transferTab(before, {
      tabId: inner.id,
      fromFolderId: f.id,
      columns: 24,
      position: { x: 4, y: 0 },
    })
    const target = next.items.find((i) => i.id === f.id) as FolderItem
    expect(target.tabs).toHaveLength(0)
    const extracted = next.items.find((i) => i.id === inner.id)
    expect(extracted?.kind).toBe("tab")
    expect(next.layouts[24][inner.id]).toBeDefined()
  })

  it("reorders a tab within the same folder", () => {
    const [a, b, c] = [
      { id: "a", name: "a", url: "https://a.example/" },
      { id: "b", name: "b", url: "https://b.example/" },
      { id: "c", name: "c", url: "https://c.example/" },
    ]
    const f = folder({ tabs: [a, b, c] })
    const next = transferTab(state([f]), {
      tabId: "a",
      fromFolderId: f.id,
      toFolderId: f.id,
      index: 2,
      columns: 24,
    })
    const target = next.items.find((i) => i.id === f.id) as FolderItem
    expect(target.tabs.map((t) => t.id)).toEqual(["b", "c", "a"])
  })

  it("refuses unknown tabs, unknown targets and duplicate ids", () => {
    const f = folder()
    const t = tab()
    const before = state([f, t])
    expect(
      transferTab(before, { tabId: "nope", toFolderId: f.id, columns: 24 })
    ).toBe(before)
    expect(
      transferTab(before, {
        tabId: t.id,
        toFolderId: "nope",
        columns: 24,
      })
    ).toBe(before)
    const dup = folder({
      tabs: [{ id: t.id, name: "x", url: "https://x.example/" }],
    })
    const f2 = folder()
    const withDup = state([dup, f2, t])
    expect(
      transferTab(withDup, {
        tabId: t.id,
        toFolderId: dup.id,
        columns: 24,
      })
    ).toBe(withDup)
  })

  it("is a no-op when source and destination are both absent or unchanged", () => {
    const t = tab()
    const before = state([t])
    expect(transferTab(before, { tabId: t.id, columns: 24 })).toBe(before)
  })
})
