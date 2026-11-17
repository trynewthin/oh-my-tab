import { describe, expect, it } from "vitest"
import { defaultConfig } from "@/lib/data/config"
import { configEntries } from "@/lib/data/workspace"
import { createCatalogComponent } from "@/lib/grid/factory"
import { allEntries, clearEntries, writeEntries } from "@/lib/storage"
let entries: Record<string, unknown> = {}
const saved = (state: unknown) => JSON.stringify({ state, version: 5 })
const { summarizeStorage, storedState, valueBytes, formatStorageBytes } =
  await import("@/lib/storage-usage")
const { clearStorageCategories } =
  await import("@/application/storage-management")
const { MOCK_DATA_VERSION } = await import("@/lib/grid/mock-version")

function setup() {
  const config = defaultConfig()
  config.home.backgroundImage = "asset:current"
  config.home.backgroundType = "image"
  config.home.color = "#ffffff"
  config.grid = {
    items: [createCatalogComponent("calendar")],
    layouts: {},
    mockDataVersion: MOCK_DATA_VERSION,
  }
  entries = {
    ...configEntries(config),
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

async function seed() {
  setup()
  await clearEntries()
  await writeEntries(entries, true)
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
    await seed()
    await clearStorageCategories(["icons", "unused-images", "system"])
    entries = await allEntries()
    expect(entries["cache:favicon:x"]).toBeUndefined()
    expect(entries["asset:old"]).toBeUndefined()
    expect(entries["asset:current"]).toBeTruthy()
    expect(entries["asset:recent"]).toBeTruthy()
    expect(entries["omt.privacy"]).toBeTruthy()
    expect(storedState(entries["omt.tab-grid"]).items).toHaveLength(1)
  })

  it("unlinks the background without resetting other preferences", async () => {
    await seed()
    await clearStorageCategories(["background"])
    entries = await allEntries()
    expect(entries["asset:current"]).toBeUndefined()
    expect(storedState(entries["omt.home-settings"]).backgroundImage).toBeNull()
    expect(storedState(entries["omt.home-settings"]).color).toBe("#ffffff")
    expect(entries["asset:old"]).toBeTruthy()
  })

  it("preserves background while clearing bookmarks prevents mock-data resurrection", async () => {
    await seed()
    await clearStorageCategories(["preferences", "bookmarks", "webdav"])
    entries = await allEntries()
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
