import { beforeEach, expect, test } from "vitest"
import { createCatalogComponent, createTabItem } from "@/lib/grid/factory"
import { applyUtilityConfiguration } from "@/lib/widgets/model"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { updateGridItem, updateUtilityWidget } from "@/stores/widget-actions"

beforeEach(() => useTabGridStore.setState({ items: [], layouts: {} }))

test("live field updates preserve the latest resized shape", () => {
  const item = createTabItem({ name: "KEEP", url: "https://example.com" })
  useTabGridStore.setState({ items: [item] })
  useTabGridStore.getState().resizeItem(item.id, "square-medium")
  updateGridItem(item.id, (current) => ({ ...current, color: "#123456" }))
  expect(useTabGridStore.getState().items).toEqual([
    { ...item, size: "square-medium", color: "#123456" },
  ])
})

test("closing or delayed edits cannot resurrect a removed component", () => {
  const item = createTabItem({ name: "KEEP", url: "https://example.com" })
  updateGridItem(item.id, () => {
    throw new Error("Removed item must not be edited")
  })
  expect(useTabGridStore.getState().items).toEqual([])
})

test("invalid updates leave the saved component untouched", () => {
  const item = createTabItem({ name: "KEEP", url: "https://example.com" })
  useTabGridStore.setState({ items: [item] })
  expect(() =>
    updateGridItem(item.id, (current) =>
      current.kind === "tab"
        ? { ...current, url: "javascript:alert(1)" }
        : current
    )
  ).toThrow()
  expect(useTabGridStore.getState().items).toEqual([item])
})

test("timer settings retain running progress updated after editing began", () => {
  const item = createCatalogComponent("pomodoro")
  if (item.kind !== "pomodoro") throw new Error("Expected timer")
  const draft = { ...item, loop: true }
  const live = {
    ...item,
    endsAt: 1_800_000_000_000,
    remainingMs: 30_000,
    completedToday: 3,
    completedOn: "2026-10-31",
  }
  useTabGridStore.setState({ items: [live] })
  updateUtilityWidget(item.id, (current) =>
    applyUtilityConfiguration(current, draft)
  )
  expect(useTabGridStore.getState().items).toEqual([{ ...live, loop: true }])
})
