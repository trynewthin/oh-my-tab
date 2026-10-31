import { i18n } from "@/i18n"
import type { GridItem, TabEntry, TodoTask } from "./types"
import type { GridPositions } from "./grid-layout"
import {
  componentLabel,
  getItemResizeOptions,
  supportsComponentAction,
} from "./registry"
import { createTabItem } from "@/lib/grid/factory"
import { findBookmarkByUrl } from "@/lib/bookmark-lookup"
import { normalizeTabUrl } from "./types"
import { canvasDimensions, dotDimensions, resizeDots } from "./dot-canvas-data"

export type GridData = {
  items: GridItem[]
  layouts: Record<number, GridPositions>
}

const mapItem = (
  items: GridItem[],
  id: string,
  change: (item: GridItem) => GridItem
) => items.map((item) => (item.id === id ? change(item) : item))

export function updateTodoTasks(
  items: GridItem[],
  id: string,
  change: (tasks: TodoTask[]) => TodoTask[]
): GridItem[] {
  return mapItem(items, id, (item) =>
    item.kind === "todo" ? { ...item, tasks: change(item.tasks) } : item
  )
}

export function setItemDynamicEffect(
  items: GridItem[],
  id: string,
  enabled: boolean
): GridItem[] {
  return mapItem(items, id, (item) =>
    supportsComponentAction(item.kind, "dynamicEffect")
      ? { ...item, dynamicEffect: enabled }
      : item
  )
}

export function setAllTabDynamicEffects(
  items: GridItem[],
  enabled: boolean
): GridItem[] {
  return items.map((item) => {
    if (
      item.kind === "tab" ||
      item.kind === "button" ||
      item.kind === "button-slot"
    )
      return { ...item, dynamicEffect: enabled }
    if (item.kind === "folder" && item.tabs.length)
      return { ...item, dynamicEffect: enabled }
    return item
  })
}

export function randomizeItemColor(
  items: GridItem[],
  id: string,
  random: (color: string) => string
): GridItem[] {
  return mapItem(items, id, (item) =>
    supportsComponentAction(item.kind, "randomColor")
      ? { ...item, color: random(item.color) }
      : item
  )
}

export function resizeItem(
  items: GridItem[],
  id: string,
  size: GridItem["size"]
): GridItem[] {
  return mapItem(items, id, (item) => {
    if (
      !supportsComponentAction(item.kind, "resize") ||
      !getItemResizeOptions(item).some((option) => option.value === size)
    )
      return item
    if (item.kind === "dot-canvas") {
      const requested = canvasDimensions(size)
      const previous = dotDimensions(item.pixels, item.pixelColumns)
      const columns = Math.max(previous.columns, requested.columns)
      const rows = Math.max(previous.rows, requested.rows)
      return {
        ...item,
        size,
        pixelColumns: columns,
        pixels:
          columns === previous.columns && rows === previous.rows
            ? item.pixels
            : resizeDots(item.pixels, item.pixelColumns, columns, rows),
      } as GridItem
    }
    return { ...item, size } as GridItem
  })
}

export function upsertItem(items: GridItem[], item: GridItem): GridItem[] {
  return items.some((existing) => existing.id === item.id)
    ? items.map((existing) => (existing.id === item.id ? item : existing))
    : [...items, item]
}

export function updateFolderTab(
  items: GridItem[],
  folderId: string,
  tabId: string,
  changes: Pick<TabEntry, "name" | "url"> & { icon?: string }
): GridItem[] {
  return mapItem(items, folderId, (item) =>
    item.kind === "folder"
      ? {
          ...item,
          tabs: item.tabs.map((tab) =>
            tab.id === tabId ? { ...tab, ...changes } : tab
          ),
        }
      : item
  )
}

export function addFolderTab(
  items: GridItem[],
  folderId: string,
  tab: TabEntry
): GridItem[] {
  return mapItem(items, folderId, (item) =>
    item.kind === "folder" ? { ...item, tabs: [...item.tabs, tab] } : item
  )
}

export function removeFolderTab(
  items: GridItem[],
  folderId: string,
  tabId: string
): GridItem[] {
  return mapItem(items, folderId, (item) =>
    item.kind === "folder"
      ? { ...item, tabs: item.tabs.filter((tab) => tab.id !== tabId) }
      : item
  )
}

export type RemoveResult = {
  items: GridItem[]
  layouts: Record<number, GridPositions>
  removed: GridItem[]
}

export function removeItems(
  state: GridData,
  ids: string[]
): RemoveResult | null {
  const removed = state.items.filter((item) => ids.includes(item.id))
  if (!removed.length) return null
  return {
    removed,
    items: state.items.filter((item) => !ids.includes(item.id)),
    layouts: Object.fromEntries(
      Object.entries(state.layouts).map(([columns, layout]) => [
        columns,
        Object.fromEntries(
          Object.entries(layout).filter(([id]) => !ids.includes(id))
        ),
      ])
    ),
  }
}

// `previous` records each removed item's original index and grid slot.
export function restoreItems(
  state: GridData,
  removed: GridItem[],
  previous: GridData
): GridData {
  const items = [...state.items]
  const layouts = { ...state.layouts }
  for (const item of removed) {
    if (items.some((entry) => entry.id === item.id)) continue
    items.splice(
      Math.min(
        previous.items.findIndex((entry) => entry.id === item.id),
        items.length
      ),
      0,
      item
    )
    for (const [columns, layout] of Object.entries(previous.layouts)) {
      if (layout[item.id])
        layouts[Number(columns)] = {
          ...layouts[Number(columns)],
          [item.id]: layout[item.id],
        }
    }
  }
  return { items, layouts }
}

export function describeRemoval(removed: GridItem[]): string {
  if (removed.length !== 1)
    return i18n.t("grid.notify.removedCount", { count: removed.length })
  const [item] = removed
  return i18n.t("grid.notify.removedItem", {
    label: componentLabel(item.kind, (key) => i18n.t(key)),
    name: item.name,
  })
}

export type UpsertBookmarkResult =
  { kind: "created" } | { kind: "updated" } | { kind: "invalid" }

export function upsertBookmark(
  items: GridItem[],
  name: string,
  url: string,
  dynamicEffect = false
): { items: GridItem[]; result: UpsertBookmarkResult } {
  const address = normalizeTabUrl(url)
  if (!name.trim() || !address) return { items, result: { kind: "invalid" } }
  const match = findBookmarkByUrl(items, address)
  if (match?.slotId)
    return {
      items: items.map((item) =>
        item.id === match.slotId && item.kind === "button-slot"
          ? {
              ...item,
              controls: item.controls.map((control) =>
                control.id === match.entry.id && control.kind === "site"
                  ? { ...control, name: name.trim(), url: address }
                  : control
              ),
            }
          : item
      ),
      result: { kind: "updated" },
    }
  if (match?.folderId)
    return {
      items: updateFolderTab(items, match.folderId, match.entry.id, {
        name: name.trim(),
        url: address,
      }),
      result: { kind: "updated" },
    }
  if (match) {
    const item = items.find((entry) => entry.id === match.entry.id)
    if (item?.kind === "tab")
      return {
        items: upsertItem(items, { ...item, name: name.trim(), url: address }),
        result: { kind: "updated" },
      }
  }
  return {
    items: upsertItem(
      items,
      createTabItem({
        name: name.trim(),
        url: address,
        dynamicEffect,
      }) as GridItem
    ),
    result: { kind: "created" },
  }
}
