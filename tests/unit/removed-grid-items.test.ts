import { describe, expect, test } from "vitest"

import { snapshot, validateConfig } from "@/application/config-transfer"
import { createCatalogComponent } from "@/lib/grid/factory"
import { dropRemovedGridItems } from "@/lib/grid/removed-items"
import { sanitizePersisted } from "@/stores/tab-grid-store"

describe("removed grid components", () => {
  test("discarding retired kinds keeps hidden and supported components", () => {
    const items = [
      { id: "old-bookmarks", kind: "bookmark-list" },
      { id: "old-search", kind: "search-full" },
      { id: "weather", kind: "weather" },
      { id: "rss", kind: "rss" },
      { id: "photo", kind: "photo" },
      { id: "minimal-search", kind: "search-minimal" },
    ]
    const result = dropRemovedGridItems(items)
    expect(result.items.map((item) => item.kind)).toEqual([
      "weather",
      "rss",
      "photo",
      "search-minimal",
    ])
    expect([...result.removedIds]).toEqual(["old-bookmarks", "old-search"])
  })

  test("legacy backups drop retired items and their layout positions", () => {
    const config = JSON.parse(JSON.stringify(snapshot()))
    const search = createCatalogComponent("search-minimal", "small")
    const weather = createCatalogComponent("weather")
    config.grid.items = [
      search,
      weather,
      { id: "old-bookmarks", kind: "bookmark-list" },
      { id: "old-search", kind: "search-full" },
    ]
    config.grid.layouts = {
      16: {
        [search.id]: { x: 0, y: 0 },
        [weather.id]: { x: 12, y: 0 },
        "old-bookmarks": { x: 0, y: 1 },
        "old-search": { x: 12, y: 1 },
      },
    }

    const restored = validateConfig(config)
    expect(restored.grid.items.map((item) => item.kind)).toEqual([
      "search-minimal",
      "weather",
    ])
    expect(Object.keys(restored.grid.layouts[16])).toEqual([
      search.id,
      weather.id,
    ])
  })

  test("saved grid state drops retired items without losing hidden widgets", () => {
    const weather = createCatalogComponent("weather")
    const saved = sanitizePersisted({
      items: [
        weather,
        { id: "old-bookmarks", kind: "bookmark-list" },
        { id: "old-search", kind: "search-full" },
      ],
      layouts: {
        16: {
          [weather.id]: { x: 0, y: 0 },
          "old-bookmarks": { x: 4, y: 0 },
          "old-search": { x: 8, y: 0 },
        },
      },
      mockDataVersion: 1,
    })
    expect(saved.items).toEqual([weather])
    expect(Object.keys(saved.layouts[16])).toEqual([weather.id])
  })
})
