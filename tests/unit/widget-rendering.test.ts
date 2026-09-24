import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, test, vi } from "vitest"
import UtilityWidgetTile from "@/components/tab-grid/utility-widget-tile"
import { createCatalogComponent } from "@/lib/grid/factory"
import { getComponentSizeOptions } from "@/lib/grid/registry"
import { isUtilityWidget, utilityWidgetKinds } from "@/lib/grid/utility-types"
import { i18n } from "@/i18n"

vi.mock("@/components/tab-grid/shared/component-background", () => ({
  default: () => null,
}))
vi.mock("@/stores/tab-grid-store", () => ({
  useTabGridStore: (selector: (state: { items: never[] }) => unknown) =>
    selector({ items: [] }),
}))
afterEach(() => vi.unstubAllGlobals())

// Server rendering only: does not launch a browser or claim layout/visual QA.
describe("widget render contracts", () => {
  for (const language of ["en", "zh-CN"]) {
    test(`all catalog sizes render readable, non-interactive ${language} previews`, async () => {
      await i18n.changeLanguage(language)
      const fetch = vi.fn()
      vi.stubGlobal("fetch", fetch)
      for (const kind of utilityWidgetKinds) {
        for (const size of getComponentSizeOptions(kind, "catalog")) {
          const item = createCatalogComponent(kind, size.value)
          if (!isUtilityWidget(item)) throw new Error("Expected utility widget")
          const html = renderToStaticMarkup(
            createElement(UtilityWidgetTile, {
              item,
              preview: true,
              onOpen: () => {},
            })
          )
          expect(html).toContain(`data-utility-widget="${kind}"`)
          expect(html).not.toMatch(
            /NaN|Invalid Date|widgets\.(design|conditions)/
          )
          expect(html).not.toMatch(/<(button|input|textarea|select|a)(\s|>)/)
        }
      }
      expect(fetch).not.toHaveBeenCalled()
    })
  }
  test("editor preview keeps note text rather than replacing it with sample copy", () => {
    const item = createCatalogComponent("note", "large")
    if (item.kind !== "note") throw new Error("Expected note")
    const html = renderToStaticMarkup(
      createElement(UtilityWidgetTile, {
        item: { ...item, text: "My actual note" },
        preview: true,
        sample: false,
        onOpen: () => {},
      })
    )
    expect(html).toContain("My actual note")
  })
})
