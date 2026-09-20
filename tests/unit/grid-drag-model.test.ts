import { describe, expect, test } from "vitest"

import {
  FOLDER_GAP_ID,
  TODO_GAP_ID,
  previewFolderTabs,
  previewTodoTasks,
  reorderTodoTasks,
} from "@/components/tab-grid/drag/model"
import {
  containsPoint,
  gridPositionFromPoint,
} from "@/components/tab-grid/drag/geometry"
import type { TabEntry, TodoTask } from "@/lib/grid/types"

const tab = (id: string): TabEntry => ({ id, name: id, url: `/${id}` })
const task = (id: string): TodoTask => ({ id, text: id, done: false })

describe("previewFolderTabs", () => {
  const tabs = [tab("a"), tab("b"), tab("c")]

  test("removes the moving tab and inserts exactly one sentinel", () => {
    const preview = previewFolderTabs(tabs, "b", 0)
    expect(preview.filter((entry) => entry.id === FOLDER_GAP_ID)).toHaveLength(1)
    expect(preview.filter((entry) => entry.id === "b")).toHaveLength(0)
    expect(preview.map((entry) => entry.id)).toEqual([FOLDER_GAP_ID, "a", "c"])
  })

  test("clamps the insertion index to the remaining length at start, middle, end", () => {
    expect(
      previewFolderTabs(tabs, "b", -5).map((entry) => entry.id)
    ).toEqual([FOLDER_GAP_ID, "a", "c"])
    expect(
      previewFolderTabs(tabs, "a", 1).map((entry) => entry.id)
    ).toEqual(["b", FOLDER_GAP_ID, "c"])
    expect(
      previewFolderTabs(tabs, "b", 99).map((entry) => entry.id)
    ).toEqual(["a", "c", FOLDER_GAP_ID])
  })

  test("does not mutate the input array", () => {
    const before = tabs.map((entry) => entry.id)
    previewFolderTabs(tabs, "a", 1)
    expect(tabs.map((entry) => entry.id)).toEqual(before)
    expect(tabs).toHaveLength(3)
  })
})

describe("previewTodoTasks", () => {
  const tasks = [task("a"), task("b"), task("c")]

  test("removes the moving task and inserts exactly one sentinel", () => {
    const preview = previewTodoTasks(tasks, "b", 0)
    expect(preview.filter((entry) => entry.id === TODO_GAP_ID)).toHaveLength(1)
    expect(preview.filter((entry) => entry.id === "b")).toHaveLength(0)
    expect(preview.map((entry) => entry.id)).toEqual([TODO_GAP_ID, "a", "c"])
  })

  test("clamps the insertion index to the remaining length at start, middle, end", () => {
    expect(
      previewTodoTasks(tasks, "b", -1).map((entry) => entry.id)
    ).toEqual([TODO_GAP_ID, "a", "c"])
    expect(
      previewTodoTasks(tasks, "a", 2).map((entry) => entry.id)
    ).toEqual(["b", "c", TODO_GAP_ID])
    expect(
      previewTodoTasks(tasks, "b", 10).map((entry) => entry.id)
    ).toEqual(["a", "c", TODO_GAP_ID])
  })

  test("does not mutate the input array", () => {
    const before = tasks.map((entry) => entry.id)
    previewTodoTasks(tasks, "c", 0)
    expect(tasks.map((entry) => entry.id)).toEqual(before)
    expect(tasks).toHaveLength(3)
  })
})

describe("reorderTodoTasks", () => {
  test("removes every occurrence of the source id before reinserting once", () => {
    const original = task("x")
    const reordered = reorderTodoTasks(
      [task("a"), original, task("b"), task("x")],
      original,
      0
    )
    expect(reordered.map((entry) => entry.id)).toEqual(["x", "a", "b"])
  })

  test("reinserts the original task object at the clamped index", () => {
    const original = task("b")
    const start = reorderTodoTasks([task("a"), original, task("c")], original, 0)
    expect(start[0]).toBe(original)
    expect(start.map((entry) => entry.id)).toEqual(["b", "a", "c"])

    const clamped = reorderTodoTasks(
      [task("a"), original, task("c")],
      original,
      99
    )
    expect(clamped.at(-1)).toBe(original)
    expect(clamped.map((entry) => entry.id)).toEqual(["a", "c", "b"])

    const negative = reorderTodoTasks(
      [task("a"), original, task("c")],
      original,
      -3
    )
    expect(negative[0]).toBe(original)
  })

  test("does not mutate the input array or its order", () => {
    const tasks = [task("a"), task("b"), task("c")]
    const before = tasks.map((entry) => entry.id)
    reorderTodoTasks(tasks, tasks[1], 0)
    expect(tasks.map((entry) => entry.id)).toEqual(before)
  })
})

describe("containsPoint", () => {
  const rect = { left: 10, top: 20, width: 100, height: 50 }

  test("treats the edges as inclusive", () => {
    expect(containsPoint({ x: 10, y: 20 }, rect)).toBe(true)
    expect(containsPoint({ x: 110, y: 70 }, rect)).toBe(true)
    expect(containsPoint({ x: 60, y: 45 }, rect)).toBe(true)
    expect(containsPoint({ x: 9, y: 45 }, rect)).toBe(false)
    expect(containsPoint({ x: 60, y: 71 }, rect)).toBe(false)
  })

  test("applies insets proportionally to the rect size", () => {
    const inset = { x: 0.1, y: 0.2 }
    // x window: [10 + 10, 10 + 90] = [20, 100]; y window: [20 + 10, 20 + 40] = [30, 60]
    expect(containsPoint({ x: 15, y: 45 }, rect, inset.x, inset.y)).toBe(false)
    expect(containsPoint({ x: 20, y: 30 }, rect, inset.x, inset.y)).toBe(true)
    expect(containsPoint({ x: 100, y: 60 }, rect, inset.x, inset.y)).toBe(true)
    expect(containsPoint({ x: 101, y: 45 }, rect, inset.x, inset.y)).toBe(false)
    expect(containsPoint({ x: 60, y: 61 }, rect, inset.x, inset.y)).toBe(false)
  })
})

describe("gridPositionFromPoint", () => {
  const bounds = { left: 0, top: 0, width: 800, height: 600 }

  const position = (
    point: { x: number; y: number },
    overrides: Partial<{
      grabOffset: { x: number; y: number }
      bounds: typeof bounds
      columns: number
      columnStep: number
      rowStep: number
      itemWidth: number
    }> = {}
  ) =>
    gridPositionFromPoint({
      point,
      grabOffset: overrides.grabOffset ?? { x: 0, y: 0 },
      bounds: overrides.bounds ?? bounds,
      columns: overrides.columns ?? 8,
      columnStep: overrides.columnStep ?? 100,
      rowStep: overrides.rowStep ?? 100,
      itemWidth: overrides.itemWidth ?? 1,
    })

  test("rounds the pointer to the nearest cell", () => {
    expect(position({ x: 140, y: 260 })).toEqual({ x: 1, y: 3 })
    expect(position({ x: 160, y: 240 })).toEqual({ x: 2, y: 2 })
  })

  test("subtracts the grab offset and the grid origin before rounding", () => {
    expect(
      position(
        { x: 360, y: 260 },
        { grabOffset: { x: 60, y: 60 }, bounds: { ...bounds, left: 100, top: 100 } }
      )
    ).toEqual({ x: 2, y: 1 })
  })

  test("clamps negative offsets to the first row and column", () => {
    expect(position({ x: -50, y: -50 })).toEqual({ x: 0, y: 0 })
  })

  test("clamps x to columns minus the item width at the right edge", () => {
    expect(position({ x: 7000, y: 0 }, { itemWidth: 4 })).toEqual({
      x: 4,
      y: 0,
    })
    expect(position({ x: 7000, y: 0 }, { itemWidth: 1 })).toEqual({
      x: 7,
      y: 0,
    })
  })

  test("caps the row at 500", () => {
    expect(position({ x: 0, y: 99999 }).y).toBe(500)
  })
})
