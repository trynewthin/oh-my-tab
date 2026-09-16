import { describe, expect, it, vi, beforeEach } from "vitest"
import {
  parseBookmarkTree,
  readBrowserBookmarks,
  supportsBrowserBookmarks,
} from "@/lib/browser-bookmarks"
import { mergeBookmarks, type BookmarkItemFactory } from "@/lib/bookmark-import"

const factory: BookmarkItemFactory = {
  createTab: ({ name, url }) => ({
    id: crypto.randomUUID(),
    kind: "tab",
    name,
    url,
    size: "small",
    color: "#6c8bd4",
  }),
  createFolder: ({ name, tabs }) => ({
    id: crypto.randomUUID(),
    kind: "folder",
    name,
    tabs,
    size: "large",
    color: "#6c8bd4",
  }),
}

const tree = [
  {
    id: "0",
    title: "",
    children: [
      {
        id: "1",
        title: "书签栏",
        children: [
          {
            id: "10",
            title: "工作",
            children: [
              { id: "11", title: "文档", url: "https://example.com/docs" },
              { id: "12", title: "脚本", url: "javascript:alert(1)" },
              { id: "13", title: "无效", url: "not a URL" },
            ],
          },
          { id: "14", title: "", url: "https://other.example" },
        ],
      },
      { id: "2", title: "其他书签", children: [] },
    ],
  },
]

beforeEach(() => {
  vi.unstubAllGlobals()
})

describe("browser-bookmarks", () => {
  it("preserves folder paths and order while filtering unsupported URLs", () => {
    expect(parseBookmarkTree(tree)).toEqual({
      bookmarks: [
        {
          name: "文档",
          url: "https://example.com/docs",
          folder: "书签栏 / 工作",
        },
        {
          name: "other.example",
          url: "https://other.example/",
          folder: "书签栏",
        },
      ],
      invalid: 2,
    })
    expect(parseBookmarkTree([])).toEqual({ bookmarks: [], invalid: 0 })
  })

  it("deduplicates repeated imports and merges into existing folders", () => {
    const parsed = parseBookmarkTree(tree)
    const first = mergeBookmarks([], parsed.bookmarks, factory)
    const second = mergeBookmarks(
      first.items,
      [
        ...parsed.bookmarks,
        {
          name: "新增",
          url: "https://new.example/",
          folder: "书签栏 / 工作",
        },
      ],
      factory
    )
    expect(second.duplicates).toBe(2)
    expect(second.added).toBe(1)
    expect(second.items.length).toBe(2)
    const folder = second.items[0]
    expect(folder.kind === "folder" && folder.tabs.length).toBe(2)
    const firstFolder = first.items[0]
    expect(firstFolder.kind === "folder" && firstFolder.tabs.length).toBe(1)
  })

  it("accesses the bookmarks API only after the user grants permission", async () => {
    vi.stubGlobal("location", { protocol: "chrome-extension:" })
    const calls: unknown[] = []
    const chrome: {
      permissions: { request: (o: unknown) => Promise<boolean> }
      bookmarks?: { getTree: () => Promise<unknown> }
    } = {
      permissions: {
        request: async (options: unknown) => {
          calls.push(options)
          chrome.bookmarks = {
            getTree: async () => {
              calls.push("getTree")
              return tree
            },
          }
          return true
        },
      },
    }
    vi.stubGlobal("chrome", chrome)
    const result = await readBrowserBookmarks()
    expect(result.bookmarks.length).toBe(2)
    expect(calls).toEqual([{ permissions: ["bookmarks"] }, "getTree"])
    chrome.permissions.request = async () => false
    chrome.bookmarks!.getTree = async () => {
      throw new Error("must not read after denial")
    }
    await expect(readBrowserBookmarks()).rejects.toThrow(/未获得/)
  })

  it("denies native bookmark access on web pages", async () => {
    vi.stubGlobal("location", { protocol: "http:" })
    vi.stubGlobal("chrome", {
      permissions: {
        request: async () => {
          throw new Error("must not request on a web page")
        },
      },
    })
    expect(supportsBrowserBookmarks()).toBe(false)
    await expect(readBrowserBookmarks()).rejects.toThrow(/扩展/)
  })
})
