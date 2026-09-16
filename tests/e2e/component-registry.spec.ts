import { expect, test } from "@playwright/test"
import { createCatalogComponent } from "../../src/components/tab-grid/factory"
import {
  catalogComponentKinds,
  componentRegistry,
  getComponentSize,
  getComponentSizeOptions,
  getItemGridDimensions,
  supportsComponentAction,
} from "../../src/lib/grid/registry"
import { validGridItem } from "../../src/components/tab-grid/validation"

test("component registry is the shared source for sizes and capabilities", () => {
  for (const definition of Object.values(componentRegistry)) {
    const values = definition.sizes.map((size) => size.value)
    expect(new Set(values).size).toBe(values.length)
    expect(values).toContain(definition.defaultSize)
    for (const value of [
      ...definition.menuSizes,
      ...definition.editorSizes,
      ...definition.catalogSizes,
    ])
      expect(values).toContain(value)
  }

  expect(getItemGridDimensions({ kind: "calendar", size: "medium" })).toEqual({
    width: 2,
    height: 2,
  })
  expect(getComponentSizeOptions("todo", "menu")).toEqual([])
  expect(
    getComponentSizeOptions("folder", "editor", "small").map(
      (size) => size.value
    )
  ).toEqual(["small", "large", "tall", "wide", "wide-tall"])
  expect(
    getComponentSizeOptions("folder", "menu").map((size) => size.value)
  ).toEqual(["wide-tall", "wide", "tall", "large"])
  expect(supportsComponentAction("calendar", "groupable")).toBe(false)
  expect(supportsComponentAction("folder", "groupable")).toBe(true)
})

test("every catalog size creates a valid component with matching dimensions", () => {
  for (const kind of catalogComponentKinds) {
    for (const size of getComponentSizeOptions(kind, "catalog")) {
      const item = createCatalogComponent(kind, size.value)
      expect(validGridItem(item)).toBe(true)
      const registered = getComponentSize(item.kind, item.size)
      expect(registered).toBeDefined()
      expect(getItemGridDimensions(item)).toEqual({
        width: registered?.width,
        height: registered?.height,
      })
    }
  }
})
