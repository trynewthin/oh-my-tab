import { readFileSync } from "node:fs"
import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import SettingItem from "@/components/settings/shared/setting-item"
import { ProductPreview } from "../../website/src/components/product-preview"

vi.mock("react-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

function source(path: string) {
  return readFileSync(new URL(`../../${path}`, import.meta.url), "utf8")
}

describe("product preview presentation", () => {
  test.each(["dark", "light"] as const)(
    "exposes only the %s screenshot to assistive technology",
    (theme) => {
      const html = renderToStaticMarkup(
        createElement(ProductPreview, { theme, onThemeChange: vi.fn() })
      )
      const images = html.match(/<img\b[^>]*>/g) ?? []
      const visible = images.filter((image) =>
        image.includes('aria-hidden="false"')
      )
      const hidden = images.filter((image) =>
        image.includes('aria-hidden="true"')
      )
      expect(images).toHaveLength(2)
      expect(visible).toHaveLength(1)
      expect(hidden).toHaveLength(1)
      expect(visible[0]).toContain(`/showcase/home-${theme}.webp`)
      expect(visible[0]).not.toContain('alt=""')
      expect(hidden[0]).toContain('alt=""')
      expect(html.match(/aria-pressed="true"/g)).toHaveLength(1)
      expect(html.match(/width="2400" height="1840"/g)).toHaveLength(2)
    }
  )

  test("connects both native buttons to the same preview region", () => {
    const html = renderToStaticMarkup(
      createElement(ProductPreview, {
        theme: "dark",
        onThemeChange: vi.fn(),
      })
    )
    const controls = [...html.matchAll(/aria-controls="([^"]+)"/g)]
    expect(controls).toHaveLength(2)
    expect(controls[0][1]).toBe(controls[1][1])
    expect(html).toContain(`id="${controls[0][1]}"`)
    expect(html.match(/type="button"/g)).toHaveLength(2)
  })
})

describe("settings presentation", () => {
  test.each([false, true])("preserves label association (wide=%s)", (wide) => {
    const html = renderToStaticMarkup(
      createElement(SettingItem, {
        label: "A longer setting label / 较长的设置名称",
        labelId: "setting-label",
        htmlFor: "setting-input",
        wide,
        children: createElement("input", { id: "setting-input" }),
      })
    )
    expect(html).toContain(
      `data-setting-item="${wide ? "wide" : "standard"}"`
    )
    expect(html).toContain('id="setting-label" for="setting-input"')
    expect(html).toContain('id="setting-input"')
    expect(html).toContain("data-setting-label")
  })
})

// These are source contracts, not computed-style or visual acceptance tests.
// Browser checks remain required before this design can leave draft status.
describe("interface stylesheet contracts", () => {
  test("keeps feedback separate from drag transforms", () => {
    const css = source("src/styles/interface.css")
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
    expect(css).toContain("@media (forced-colors: active)")
    expect(css).not.toMatch(/transition(?:-property)?:\s*all\b/)
    expect(css).not.toMatch(/\btransform\s*:/)
  })

  test("responds to pane width, not label contents", () => {
    const css = source("src/styles/interface.css")
    expect(css).toContain("container-name: application-content")
    expect(css).toContain("@container application-content (max-width: 26rem)")
    expect(css).toContain("[data-setting-item]")
    expect(source("src/index.css")).not.toContain(
      "[data-settings-content] .grid.grid-cols-2.items-center"
    )
  })

  test("uses local fonts without perpetual display motion", () => {
    const css = source("website/src/styles.css")
    expect(source("website/src/main.tsx")).toContain(
      'import "@fontsource-variable/inter"'
    )
    expect(css).toContain('"Inter Variable"')
    expect(css).toContain("@media (prefers-reduced-motion: reduce)")
    expect(css).toContain("@media (hover: hover) and (pointer: fine)")
    expect(css).not.toMatch(/animation[^;{}]*\binfinite\b/)
    expect(css).not.toMatch(/@import\s+url\(https?:/)
  })
})
