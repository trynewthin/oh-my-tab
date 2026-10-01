import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import GridItemDialog from "@/components/tab-grid/grid-item-dialog"
import ComponentEditorFrame from "@/components/tab-grid/component-editor-frame"
import TabUI from "@/components/tab-grid/tab-ui"
import { useTabGridStore } from "@/stores/tab-grid-store"
import type { TabItem } from "@/lib/grid/types"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({
    t: (key: string, values?: { label?: string }) =>
      values?.label ? `${key}:${values.label}` : key,
  }),
}))

vi.mock("@/components/application/application-dialog", () => ({
  default: ({ children }: { children: ReactNode }) =>
    createElement("section", null, children),
}))

vi.mock("@/components/tab-grid/catalog-component-preview", () => ({
  default: () => createElement("div", { "data-preview": "true" }),
}))

vi.mock("@/components/ui/dialog", () => {
  const pass = ({ children }: { children?: ReactNode }) =>
    createElement("div", null, children)
  return {
    Dialog: pass,
    DialogContent: pass,
    DialogClose: pass,
    DialogTitle: ({
      children,
      className,
    }: {
      children?: ReactNode
      className?: string
    }) => createElement("h2", { className }, children),
    DialogDescription: ({
      children,
      className,
    }: {
      children?: ReactNode
      className?: string
    }) => createElement("p", { className }, children),
  }
})

describe("gallery content hierarchy", () => {
  test("separates the trigger from the real preview and keeps descriptions readable", () => {
    const before = useTabGridStore.getState().items
    const html = renderToStaticMarkup(
      createElement(GridItemDialog, { onClose: vi.fn() })
    )
    const articles = html.match(/<article\b[\s\S]*?<\/article>/g) ?? []
    expect(articles).toHaveLength(3)
    for (const article of articles) {
      expect(article).toContain("catalog-card-preview")
      expect(article).toContain("catalog-card-copy")
      expect(article).toMatch(/<h3>[^<]+<\/h3>/)
      expect(article).toMatch(/aria-describedby="[^"]+"/)
      expect(article).not.toContain("truncate")
      const button = article.match(/<button\b[^>]*>([\s\S]*?)<\/button>/)
      expect(button).not.toBeNull()
      expect(button![1]).toBe("")
    }
    expect(useTabGridStore.getState().items).toBe(before)
  })
})

describe("split component editor", () => {
  test("shows its title and description, and places fields outside the preview", () => {
    const html = renderToStaticMarkup(
      createElement(ComponentEditorFrame, {
        title: "Edit a component",
        description: "Preview and settings stay separate.",
        width: 4,
        height: 4,
        preview: createElement("span", null, "Actual widget"),
        onClose: vi.fn(),
        onSubmit: vi.fn(),
        submitLabel: "Save",
        children: createElement("input", { name: "component-name" }),
      })
    )
    expect(html).toContain('<h2 class="studio-title">Edit a component</h2>')
    expect(html).toContain('class="studio-description"')
    expect(html.indexOf("studio-preview-panel")).toBeLessThan(
      html.indexOf("studio-editor-form")
    )
    expect(html).toContain('data-component-editor-preview="true" inert=""')
    expect(html).toContain('type="submit"')
  })
})

describe("bookmark typography", () => {
  const item: TabItem = {
    id: "sample",
    kind: "tab",
    size: "medium",
    name: "Documentation",
    url: "https://docs.example.org/reference",
    color: "#6c8bd4",
  }

  test("adds secondary domain copy without changing the link name or target", () => {
    const html = renderToStaticMarkup(createElement(TabUI, { item }))
    expect(html).toContain('aria-label="Documentation"')
    expect(html).toContain('href="https://docs.example.org/reference"')
    expect(html).toContain('class="bookmark-host">docs.example.org</span>')
    const small = renderToStaticMarkup(
      createElement(TabUI, { item: { ...item, size: "small" } })
    )
    expect(small).not.toContain("bookmark-host")
  })

  test("keeps the editor preview non-navigating", () => {
    const html = renderToStaticMarkup(
      createElement(TabUI, { item, preview: true })
    )
    expect(html).not.toContain("<a ")
    expect(html).not.toContain("href=")
  })
})
