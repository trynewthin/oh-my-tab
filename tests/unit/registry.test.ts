import { describe, expect, test } from "vitest"
import {
  GRID_OCCUPANCY,
  catalogComponentKinds,
  componentRegistry,
  getItemGridDimensions,
  getComponentSizeOptions,
  occupancyMark,
  sizeLabel,
} from "@/lib/grid/registry"
import { createCatalogComponent } from "@/lib/grid/factory"
import { utilityWidgetKinds } from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"

describe("component occupancy registration", () => {
  test("clock offers 2x1, 4x2 and 2x4 without a background border or background effects", () => {
    expect(
      getComponentSizeOptions("clock", "catalog").map(({ width, height }) => [
        width,
        height,
      ])
    ).toEqual([
      [2, 1],
      [4, 2],
      [2, 4],
    ])
    expect(componentRegistry.clock.tileBorder).toBe(false)
    expect(componentRegistry.clock.actions.dynamicEffect).toBe(false)
    expect(componentRegistry.clock.menu.operations).not.toContain(
      "dynamicEffect"
    )
    expect(
      validGridItem({ ...createCatalogComponent("clock"), size: "large" })
    ).toBe(false)
  })
  test("every size picks a unique occupancy from the shared scale", () => {
    for (const [kind, definition] of Object.entries(componentRegistry)) {
      const occupancies = definition.sizes.map((size) => size.occupancy)
      expect(new Set(occupancies).size, kind).toBe(occupancies.length)
      for (const size of definition.sizes) {
        expect(GRID_OCCUPANCY[size.occupancy], `${kind} ${size.value}`).toEqual(
          {
            width: size.width,
            height: size.height,
          }
        )
        // Display text is resolved from `roleKey`, never stored: the label is
        // the translated role word plus the numeric mark.
        const expected = occupancyMark(size.width, size.height)
        expect(sizeLabel(size, (key) => key)).toBe(
          size.roleKey ? `${size.roleKey} · ${expected}` : expected
        )
      }
    }
  })

  test("registry display metadata is translation keys, not literals", () => {
    for (const [kind, definition] of Object.entries(componentRegistry)) {
      for (const key of [
        definition.labelKey,
        definition.descriptionKey,
        definition.defaultNameKey,
      ])
        expect(key, kind).toMatch(/^grid\.component\./)
    }
  })

  test("every catalog component belongs to one catalog section", () => {
    expect(
      Object.fromEntries(
        catalogComponentKinds.map((kind) => [
          kind,
          componentRegistry[kind].catalogSection,
        ])
      )
    ).toEqual({
      button: "common",
      clock: "common",
      "dot-canvas": "dots",
      todo: "productivity",
      calendar: "productivity",
      workday: "productivity",
      pomodoro: "productivity",
      countdown: "productivity",
      "search-minimal": "common",
      ecosystem: "fun",
    })
    for (const kind of [
      ...utilityWidgetKinds.filter(
        (kind) =>
          kind !== "pomodoro" &&
          kind !== "countdown" &&
          kind !== "workday" &&
          kind !== "clock"
      ),
      "bookmark-list",
      "search-full",
    ])
      expect(catalogComponentKinds).not.toContain(kind)
    expect(componentRegistry).not.toHaveProperty("bookmark-list")
    expect(componentRegistry).not.toHaveProperty("search-full")
  })

  test.each([
    ["compact", 4],
    ["medium", 8],
    ["small", 12],
  ] as const)(
    "search size %s survives creation and validation",
    (size, width) => {
      const item = createCatalogComponent("search-minimal", size)
      expect(item.size).toBe(size)
      expect(validGridItem(JSON.parse(JSON.stringify(item)))).toBe(true)
      expect(getItemGridDimensions(item)).toEqual({ width, height: 1 })
    }
  )

  test("search widgets expose the shared editor without changing their saved sizes", () => {
    expect(componentRegistry["search-minimal"].menu.operations).toContain(
      "edit"
    )
    expect(componentRegistry["search-minimal"].showNameInEditor).toBe(false)
    expect(componentRegistry["search-minimal"].editorSizes).toEqual([
      "compact",
      "medium",
      "small",
    ])
  })

  test("1×1 is the square unit and template uses the scale", () => {
    expect(GRID_OCCUPANCY["1x1"]).toEqual({ width: 1, height: 1 })
    expect(getItemGridDimensions({ kind: "template", size: "small" })).toEqual({
      width: 1,
      height: 1,
    })
    expect(getItemGridDimensions({ kind: "tab", size: "small" })).toEqual({
      width: 4,
      height: 1,
    })
    const button = createCatalogComponent("button")
    expect(button).toMatchObject({
      kind: "button",
      size: "small",
      action: "toggle-theme",
    })
    expect(validGridItem(button)).toBe(true)
    expect(validGridItem({ ...button, action: "add-tab" })).toBe(true)
    expect(validGridItem({ ...button, action: "add-folder" })).toBe(true)
    expect(validGridItem({ ...button, action: "missing-action" })).toBe(false)
    expect(getItemGridDimensions(button)).toEqual({ width: 1, height: 1 })
    expect(getItemGridDimensions({ kind: "calendar", size: "medium" })).toEqual(
      {
        width: 2,
        height: 2,
      }
    )
  })
})
