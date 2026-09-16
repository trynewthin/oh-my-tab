import { describe, expect, it, vi } from "vitest"

let entries: Record<string, unknown> = {}
const saved = (state: unknown) => JSON.stringify({ state, version: 0 })

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>()
  return {
    ...actual,
    editStoredEntries: async (
      plan: (e: Record<string, unknown>) => {
        updates: Record<string, unknown>
        remove: string[]
      }
    ) => {
      const { updates, remove } = plan(entries)
      Object.assign(entries, updates)
      for (const key of remove) delete entries[key]
    },
  }
})

const { summarizeStorage, storedState, valueBytes, formatStorageBytes } =
  await import("@/lib/storage-usage")
const { clearStorageCategories } = await import("@/lib/storage-management")
const { MOCK_DATA_VERSION } = await import(
  "@/components/tab-grid/mock-version"
)

function setup() {
  entries = {
    "omt.home-settings": saved({
      backgroundImage: "asset:current",
      backgroundType: "image",
      color: "#ffffff",
    }),
    "omt.tab-grid": saved({ items: [{ id: "bookmark" }], layouts: {} }),
    "omt.privacy": saved({ icons: true }),
    "omt.webdav": JSON.stringify({
      url: "https://example.com/",
      username: "user",
    }),
    "asset:current": { createdAt: 1, value: new Blob(["original"]) },
    "asset:old": { createdAt: 1, value: new Blob(["old"]) },
    "asset:recent": { createdAt: Date.now(), value: new Blob(["new"]) },
    "cache:favicon:x": { blob: new Blob(["icon"]) },
  }
}

describe("storage-usage", () => {
  it("categorizes data and accounts for nested Blob bytes", () => {
    setup()
    const rows = summarizeStorage(entries)
    expect(rows.find((row) => row.id === "background")!.count).toBe(1)
    expect(rows.find((row) => row.id === "unused-images")!.count).toBe(2)
    const unused = rows.find((row) => row.id === "unused-images")!
    expect(unused.clearableBytes).toBeLessThan(unused.bytes)
    expect(valueBytes(new Blob(["12345"]))).toBe(5)
    expect(formatStorageBytes(1024)).toBe("1.0 KB")
  })
})

describe("clearStorageCategories", () => {
  it("preserves active, recent and unselected data on selective clear", async () => {
    setup()
    await clearStorageCategories(["icons", "unused-images", "system"])
    expect(entries["cache:favicon:x"]).toBeUndefined()
    expect(entries["asset:old"]).toBeUndefined()
    expect(entries["asset:current"]).toBeTruthy()
    expect(entries["asset:recent"]).toBeTruthy()
    expect(entries["omt.privacy"]).toBeTruthy()
    expect(storedState(entries["omt.tab-grid"]).items).toHaveLength(1)
  })

  it("unlinks the background without resetting other preferences", async () => {
    setup()
    await clearStorageCategories(["background"])
    expect(entries["asset:current"]).toBeUndefined()
    expect(storedState(entries["omt.home-settings"]).backgroundImage).toBeNull()
    expect(storedState(entries["omt.home-settings"]).color).toBe("#ffffff")
    expect(entries["asset:old"]).toBeTruthy()
  })

  it("preserves background while clearing bookmarks prevents mock-data resurrection", async () => {
    setup()
    await clearStorageCategories(["preferences", "bookmarks", "webdav"])
    expect(storedState(entries["omt.home-settings"]).backgroundImage).toBe(
      "asset:current"
    )
    expect(storedState(entries["omt.home-settings"]).color).toBe("#3478f6")
    expect(storedState(entries["omt.tab-grid"]).items).toEqual([])
    expect(storedState(entries["omt.tab-grid"]).mockDataVersion).toBe(
      MOCK_DATA_VERSION
    )
    expect(entries["omt.webdav"]).toBeNull()
    expect(entries["omt.sync-provider"]).toBe("local")
    expect(entries["omt.privacy"]).toBeTruthy()
  })
})
