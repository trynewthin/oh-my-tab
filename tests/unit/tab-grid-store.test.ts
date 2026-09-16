import { describe, expect, it, beforeEach } from "vitest"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useToastStore } from "@/stores/toast-store"
import type { FolderItem, GridItem, TabItem } from "@/lib/grid/types"

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
function reset(items: GridItem[] = []) {
  useTabGridStore.setState({
    items,
    layouts: {},
    lastLayoutColumns: undefined,
  })
  useToastStore.setState({ messages: [] })
}

beforeEach(() => reset())

describe("tab-grid-store", () => {
  it("groups tabs into a new folder", () => {
    const [a, b] = [tab(), tab()]
    reset([a, b])
    useTabGridStore.setState({
      lastLayoutColumns: 24,
      layouts: { 24: { [a.id]: { x: 0, y: 0 }, [b.id]: { x: 4, y: 0 } } },
    })
    expect(useTabGridStore.getState().groupItems([a.id, b.id], "工作")).toBe(
      true
    )
    const items = useTabGridStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].kind).toBe("folder")
    expect(items[0].name).toBe("工作")
    expect((items[0] as FolderItem).tabs).toHaveLength(2)
  })

  it("removes items and restores them with layout on undo", () => {
    const [a, b] = [tab(), tab()]
    reset([a, b])
    useTabGridStore.setState({
      lastLayoutColumns: 24,
      layouts: { 24: { [a.id]: { x: 0, y: 0 }, [b.id]: { x: 4, y: 0 } } },
    })
    useTabGridStore.getState().removeItems([a.id])
    let items = useTabGridStore.getState().items
    expect(items.map((i) => i.id)).toEqual([b.id])
    expect(useTabGridStore.getState().layouts[24][a.id]).toBeUndefined()

    const message = useToastStore.getState().messages.at(-1)
    expect(message?.action).toBeTruthy()
    message!.action!.run()

    items = useTabGridStore.getState().items
    expect(items.map((i) => i.id)).toEqual([a.id, b.id])
    expect(useTabGridStore.getState().layouts[24][a.id]).toEqual({
      x: 0,
      y: 0,
    })
  })

  it("keeps existing order and layout when undoing a middle removal", () => {
    const [a, b, c] = [tab(), tab(), tab()]
    reset([a, b, c])
    useTabGridStore.setState({
      lastLayoutColumns: 24,
      layouts: {
        24: {
          [a.id]: { x: 0, y: 0 },
          [b.id]: { x: 4, y: 0 },
          [c.id]: { x: 8, y: 0 },
        },
      },
    })
    useTabGridStore.getState().removeItems([b.id])
    useToastStore.getState().messages.at(-1)!.action!.run()
    expect(useTabGridStore.getState().items.map((i) => i.id)).toEqual([
      a.id,
      b.id,
      c.id,
    ])
    expect(useTabGridStore.getState().layouts[24][b.id]).toEqual({
      x: 4,
      y: 0,
    })
  })

  it("deduplicates bookmark imports by URL", () => {
    const existing = tab({ url: "https://dup.example/" })
    reset([existing])
    const result = useTabGridStore.getState().importBookmarks([
      { name: "dup", url: "https://dup.example/", folder: "" },
      { name: "new", url: "https://new.example/", folder: "" },
    ])
    expect(result).toEqual({ added: 1, duplicates: 1 })
    expect(useTabGridStore.getState().items).toHaveLength(2)
  })

  it("upserts a bookmark by URL and normalizes the address", () => {
    const existing = tab({ url: "https://site.example/", name: "old" })
    reset([existing])
    useTabGridStore.getState().upsertBookmark("renamed", "site.example")
    const items = useTabGridStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe("renamed")
    expect((items[0] as TabItem).url).toBe("https://site.example/")
  })

  it("creates a bookmark when no URL match exists", () => {
    reset()
    useTabGridStore.getState().upsertBookmark("new", "https://fresh.example/")
    const items = useTabGridStore.getState().items
    expect(items).toHaveLength(1)
    expect(items[0].name).toBe("new")
  })

  it("rejects bookmark upserts with empty name or invalid URL", () => {
    expect(() =>
      useTabGridStore.getState().upsertBookmark(" ", "https://x.example")
    ).toThrow(/名称和有效网址/)
    expect(() =>
      useTabGridStore.getState().upsertBookmark("x", "not a url")
    ).toThrow(/名称和有效网址/)
  })
})
