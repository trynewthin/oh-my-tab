import {
  placeItems,
  type GridPosition,
  type GridPositions,
} from "./grid-layout"
import type { GridItem, TabEntry, TabItem } from "./types"

export type TabTransfer = {
  tabId: string
  fromFolderId?: string
  toFolderId?: string
  index?: number
  columns: number
  position?: GridPosition
}

type GridData = { items: GridItem[]; layouts: Record<number, GridPositions> }

export function transferTab(state: GridData, move: TabTransfer): GridData {
  const source = move.fromFolderId
    ? state.items.find(
        (item) => item.id === move.fromFolderId && item.kind === "folder"
      )
    : undefined
  const tab = move.fromFolderId
    ? source?.kind === "folder"
      ? source.tabs.find((tab) => tab.id === move.tabId)
      : undefined
    : state.items.find((item) => item.id === move.tabId && item.kind === "tab")
  if (!tab || !("url" in tab)) return state
  const target = state.items.find(
    (item) => item.id === move.toFolderId && item.kind === "folder"
  )
  if (move.toFolderId && target?.kind !== "folder") return state
  if (
    move.toFolderId &&
    move.toFolderId !== move.fromFolderId &&
    target?.kind === "folder" &&
    target.tabs.some((entry) => entry.id === tab.id)
  )
    return state
  if (!move.toFolderId && !move.fromFolderId) return state
  if (!move.toFolderId && state.items.some((item) => item.id === tab.id))
    return state

  let items = state.items
    .filter((item) => move.fromFolderId || item.id !== tab.id)
    .map((item): GridItem => {
      if (item.kind !== "folder") return item
      let tabs =
        item.id === move.fromFolderId
          ? item.tabs.filter((entry) => entry.id !== tab.id)
          : item.tabs
      if (item.id === move.toFolderId) {
        tabs = [...tabs]
        const entry: TabEntry = {
          id: tab.id,
          name: tab.name,
          url: tab.url,
          size: tab.size,
          color: tab.color,
          dynamicEffect: tab.dynamicEffect,
        }
        tabs.splice(
          Math.max(0, Math.min(tabs.length, move.index ?? tabs.length)),
          0,
          entry
        )
      }
      return tabs === item.tabs ? item : { ...item, tabs }
    })
  const layouts = Object.fromEntries(
    Object.entries(state.layouts).map(([columns, layout]) => [
      columns,
      Object.fromEntries(
        Object.entries(layout).filter(([id]) => id !== tab.id)
      ),
    ])
  )
  if (!move.toFolderId) {
    const extracted: TabItem = {
      id: tab.id,
      kind: "tab",
      name: tab.name,
      url: tab.url,
      size: tab.size === "medium" ? "medium" : "small",
      color: tab.color ?? source?.color ?? "#6c8bd4",
      dynamicEffect: tab.dynamicEffect,
    }
    items = [...items, extracted]
    const placed = placeItems(
      items,
      move.columns,
      layouts[move.columns] ?? {},
      { id: tab.id, position: move.position ?? { x: 0, y: 0 } }
    )
    layouts[move.columns] = Object.fromEntries(
      Object.entries(placed).map(([id, { x, y }]) => [id, { x, y }])
    )
  }
  return { items, layouts }
}
