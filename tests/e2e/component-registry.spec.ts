import { expect, test } from "@playwright/test"
import { createCatalogComponent } from "../../src/lib/grid/factory"
import {
  GRID_OCCUPANCY,
  catalogComponentKinds,
  componentRegistry,
  getComponentSize,
  getComponentSizeOptions,
  getItemGridDimensions,
  occupancyMark,
  sizeLabel,
  supportsComponentAction,
} from "../../src/lib/grid/registry"
import { validGridItem } from "../../src/lib/grid/validation"

test("component registry is the shared source for sizes and capabilities", () => {
  for (const definition of Object.values(componentRegistry)) {
    const values = definition.sizes.map((size) => size.value)
    expect(new Set(values).size).toBe(values.length)
    expect(values).toContain(definition.defaultSize)
    for (const value of definition.catalogSizes) expect(values).toContain(value)
    expect(definition.actions.resize).toBe(definition.sizes.length > 1)
    const occupancies = definition.sizes.map((size) => size.occupancy)
    expect(new Set(occupancies).size).toBe(occupancies.length)
    for (const size of definition.sizes) {
      expect(GRID_OCCUPANCY[size.occupancy]).toEqual({
        width: size.width,
        height: size.height,
      })
      const mark = occupancyMark(size.width, size.height)
      expect(sizeLabel(size, (key) => key)).toBe(
        size.roleKey ? `${size.roleKey} · ${mark}` : mark
      )
    }
  }

  expect(getItemGridDimensions({ kind: "calendar", size: "medium" })).toEqual({
    width: 2,
    height: 2,
  })
  expect(getItemGridDimensions({ kind: "template", size: "small" })).toEqual({
    width: 1,
    height: 1,
  })
  expect(getItemGridDimensions({ kind: "template", size: "wide" })).toEqual({
    width: 4,
    height: 1,
  })
  expect(supportsComponentAction("template", "groupable")).toBe(false)
  expect(
    getComponentSizeOptions("todo", "resize").map((size) => size.value)
  ).toEqual(["large"])
  expect(
    getComponentSizeOptions("folder", "editor").map((size) => size.value)
  ).toEqual(["large", "tall", "wide", "wide-tall"])
  expect(getComponentSize("folder", "small")).toMatchObject({
    width: 4,
    height: 2,
  })
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
