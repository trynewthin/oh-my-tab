import { describe, expect, test } from "vitest"
import { decodeBackup, encodeBackup } from "@/lib/backup-codec"
import { createCatalogComponent } from "@/lib/grid/factory"
import { utilityWidgetKinds } from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import { resources } from "@/i18n"

const png =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a/54AAAAASUVORK5CYII="

describe("utility widget backups", () => {
  test("preserves all widget payloads through the ZIP codec", async () => {
    const items = utilityWidgetKinds.map((kind) => {
      const item = createCatalogComponent(kind)
      switch (item.kind) {
        case "note":
          return { ...item, text: "First line\n第二行" }
        case "photo":
          return { ...item, image: png, caption: "Local photo" }
        case "countdown":
          return {
            ...item,
            events: [{ id: "event", title: "Trip", date: "2027-01-15" }],
          }
        case "pomodoro":
          return { ...item, endsAt: 1_800_000_000_000 }
        case "weather":
          return { ...item, latitude: 35.68, longitude: 139.69 }
        case "rss":
          return { ...item, feedUrl: "https://example.com/feed.xml" }
        case "bookmark-list":
          return { ...item, folderId: "existing-folder" }
        default:
          return item
      }
    })
    expect(items.every(validGridItem)).toBe(true)
    const config = { grid: { items, layouts: {} } }
    const decoded = await decodeBackup(await encodeBackup(config))
    expect(decoded.config).toEqual(config)
    expect(decoded.image).toBeUndefined()
  })

  test("both languages cover all component metadata and messages", () => {
    for (const language of ["en", "zh-CN"] as const) {
      for (const kind of utilityWidgetKinds) {
        const component = resources[language].translation.grid.component[kind]
        expect(component.label).toBeTruthy()
        expect(component.description).toBeTruthy()
        expect(component.defaultName).toBeTruthy()
      }
    }
    const en = resources.en.translation.widgets
    const zh = resources["zh-CN"].translation.widgets
    expect(Object.keys(en).sort()).toEqual(Object.keys(zh).sort())
    expect(Object.keys(en.errors).sort()).toEqual(Object.keys(zh.errors).sort())
  })
})
