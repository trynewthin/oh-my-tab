import { expect, test } from "@playwright/test"
import {
  groupComponents,
  resolveGroupAction,
} from "../../src/components/tab-grid/model/grid-operations"
import type { GridItem } from "../../src/components/tab-grid/types"

const tab = (id: string, name = id): Extract<GridItem, { kind: "tab" }> => ({
  id,
  kind: "tab",
  name,
  url: `https://example.com/${id}`,
  color: "#6c8bd4",
  size: "small",
})

const folder = (
  id: string,
  tabs: Extract<GridItem, { kind: "tab" }>[] = []
): Extract<GridItem, { kind: "folder" }> => ({
  id,
  kind: "folder",
  name: id,
  color: "#6c8bd4",
  size: "large",
  tabs: tabs.map(({ id, name, url, size, color }) => ({
    id,
    name,
    url,
    size,
    color,
  })),
})

const calendar = (): Extract<GridItem, { kind: "calendar" }> => ({
  id: "cal",
  kind: "calendar",
  name: "日历",
  color: "#6c8bd4",
  size: "large",
})

test("group action follows folder and tab combinations", () => {
  expect(resolveGroupAction([tab("a")])).toEqual({ kind: "disabled" })
  expect(resolveGroupAction([tab("a"), calendar()])).toEqual({
    kind: "disabled",
  })
  expect(resolveGroupAction([folder("f"), tab("a")])).toEqual({
    kind: "move",
    folderId: "f",
  })
  expect(resolveGroupAction([tab("a"), tab("b")])).toEqual({ kind: "create" })
  expect(resolveGroupAction([folder("f1"), folder("f2"), tab("a")])).toEqual({
    kind: "create",
  })
})

test("one folder and tabs move into the existing folder", () => {
  const next = groupComponents(
    {
      items: [tab("a"), folder("f", [tab("child")])],
      layouts: {},
    },
    ["a", "f"]
  )
  expect(next?.items.map((item) => item.id)).toEqual(["f"])
  expect(next?.items[0]).toMatchObject({
    id: "f",
    kind: "folder",
    tabs: [{ id: "child" }, { id: "a" }],
  })
})

test("tabs and multiple folders merge into a named folder", () => {
  const next = groupComponents(
    {
      items: [folder("f1", [tab("one")]), folder("f2", [tab("two")]), tab("a")],
      layouts: {},
    },
    ["f1", "f2", "a"],
    "项目"
  )
  expect(next?.items).toHaveLength(1)
  expect(next?.items[0]).toMatchObject({
    kind: "folder",
    name: "项目",
    tabs: [{ id: "one" }, { id: "two" }, { id: "a" }],
  })
})
