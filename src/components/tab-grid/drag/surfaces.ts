import type { GridItem } from "@/lib/grid/types"
import {
  FOLDER_GAP_ID,
  TODO_GAP_ID,
  type Bounds,
  type DragSession,
  type Point,
} from "./model"

// Browser-surface adapter for the drag lifecycle: resolves live geometry and
// insertion indices straight from the DOM. This module intentionally touches
// document/querySelector — it is the only place the drag machine reads the
// rendered grid, folder and todo surfaces, so the hook stays free of DOM
// queries. No React, stores, dnd-kit or mutation belongs here.

export function findGridItemBounds(
  grid: HTMLDivElement | null,
  id: string
): Bounds | null {
  const element = Array.from(grid?.children ?? []).find(
    (node) => node.getAttribute("data-grid-item-id") === id
  )
  return element?.getBoundingClientRect() ?? null
}

export function folderInsertionIndex(
  items: GridItem[],
  id: string,
  point: Point,
  session: DragSession
): number {
  const folder = items.find((item) => item.id === id)
  if (folder?.kind !== "folder") return 0
  const remaining = folder.tabs.filter((tab) => tab.id !== session.item.id)
  const surface = Array.from(
    document.querySelectorAll<HTMLElement>("[data-folder-surface]")
  ).find(
    (node) =>
      node.dataset.folderId === id &&
      node.dataset.folderSurface ===
        (session.dialogBounds && !session.dialogExited ? "dialog" : "preview")
  )
  if (!surface) return remaining.length
  const viewport = surface.getBoundingClientRect()
  const rows = Array.from(
    surface.querySelectorAll<HTMLElement>("[data-stack-row]")
  )
  for (const row of rows) {
    if (
      !row.dataset.tabId ||
      row.dataset.tabId === session.item.id ||
      row.dataset.tabId === FOLDER_GAP_ID ||
      row.inert
    )
      continue
    const rect = row.getBoundingClientRect()
    if (rect.bottom <= viewport.top || rect.top >= viewport.bottom) continue
    if (
      surface.dataset.folderSurface === "dialog" && window.innerWidth >= 1024
        ? point.y < rect.top ||
          (point.y <= rect.bottom && point.x < rect.left + rect.width / 2)
        : point.y < rect.top + rect.height / 2
    )
      return Math.max(
        0,
        remaining.findIndex((tab) => tab.id === row.dataset.tabId)
      )
  }
  const visible = rows.filter(
    (row) =>
      !row.inert &&
      row.dataset.tabId &&
      row.dataset.tabId !== session.item.id &&
      row.dataset.tabId !== FOLDER_GAP_ID &&
      row.getBoundingClientRect().top < viewport.bottom
  )
  const last = visible.at(-1)
  return last
    ? remaining.findIndex((tab) => tab.id === last.dataset.tabId) + 1
    : remaining.length
}

export function todoInsertionIndex(
  items: GridItem[],
  id: string,
  point: Point,
  session: DragSession
): number {
  const todo = items.find((item) => item.id === id)
  if (todo?.kind !== "todo") return 0
  const remaining = todo.tasks.filter(
    (task) => task.id !== session.todoTask?.id
  )
  const surface = Array.from(
    document.querySelectorAll<HTMLElement>("[data-todo-surface]")
  ).find(
    (node) =>
      node.dataset.todoId === id &&
      node.dataset.todoSurface === session.sourceSurface
  )
  if (!surface) return remaining.length
  const rows = Array.from(
    surface.querySelectorAll<HTMLElement>("[data-stack-row]")
  )
  for (const row of rows) {
    if (
      !row.dataset.tabId ||
      row.dataset.tabId === session.todoTask?.id ||
      row.dataset.tabId === TODO_GAP_ID
    )
      continue
    const rect = row.getBoundingClientRect()
    if (
      point.y < rect.top ||
      (point.y <= rect.bottom && point.x < rect.left + rect.width / 2)
    )
      return Math.max(
        0,
        remaining.findIndex((task) => task.id === row.dataset.tabId)
      )
  }
  return remaining.length
}
