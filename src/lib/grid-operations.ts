import type { GridItem, TabEntry } from "@/components/tab-grid/types"
import type { GridPositions } from "@/components/tab-grid/grid-layout"
import { supportsComponentAction } from "@/components/tab-grid/model/registry"
import { createFolderItem } from "@/components/tab-grid/model/factory"
type GridData = {
  items: GridItem[]
  layouts: Record<number, GridPositions>
  lastLayoutColumns?: number
}

export type GroupAction =
  { kind: "disabled" } | { kind: "move"; folderId: string } | { kind: "create" }

function sortByLayout(items: GridItem[], layout: GridPositions): GridItem[] {
  return [...items].sort(
    (a, b) =>
      (layout[a.id]?.y ?? 0) - (layout[b.id]?.y ?? 0) ||
      (layout[a.id]?.x ?? 0) - (layout[b.id]?.x ?? 0)
  )
}

function tabEntry(item: Extract<GridItem, { kind: "tab" }>): TabEntry {
  return {
    id: item.id,
    name: item.name,
    url: item.url,
    size: item.size,
    color: item.color,
    dynamicEffect: item.dynamicEffect,
  }
}

export function resolveGroupAction(items: GridItem[]): GroupAction {
  if (items.length < 2) return { kind: "disabled" }
  if (items.some((item) => !supportsComponentAction(item.kind, "groupable")))
    return { kind: "disabled" }
  const folders = items.filter((item) => item.kind === "folder")
  const tabs = items.filter((item) => item.kind === "tab")
  if (folders.length + tabs.length !== items.length) return { kind: "disabled" }
  const folder = folders[0]
  if (folders.length === 1 && tabs.length > 0 && folder)
    return { kind: "move", folderId: folder.id }
  return { kind: "create" }
}

export function groupComponents(
  before: GridData,
  ids: string[],
  name?: string
) {
  const selected = before.items.filter((item) => ids.includes(item.id))
  const action = resolveGroupAction(selected)
  if (action.kind === "disabled") return null
  const layout = before.layouts[before.lastLayoutColumns ?? 0] ?? {}
  const ordered = sortByLayout(selected, layout)
  if (action.kind === "move") {
    const folder = ordered.find((item) => item.id === action.folderId)
    if (folder?.kind !== "folder") return null
    const tabs = ordered.filter((item) => item.kind === "tab")
    const existing = new Set(folder.tabs.map((tab) => tab.id))
    const nextFolder = {
      ...folder,
      tabs: [
        ...folder.tabs,
        ...tabs.filter((item) => !existing.has(item.id)).map(tabEntry),
      ],
    }
    const remove = new Set(tabs.map((item) => item.id))
    return {
      items: before.items
        .filter((item) => !remove.has(item.id))
        .map((item) => (item.id === folder.id ? nextFolder : item)),
      layouts: Object.fromEntries(
        Object.entries(before.layouts).map(([columns, positions]) => [
          columns,
          Object.fromEntries(
            Object.entries(positions).filter(([id]) => !remove.has(id))
          ),
        ])
      ),
    }
  }
  if (!name?.trim()) return null
  const folder = createFolderItem({
    name: name.trim(),
    color: ordered[0].color,
    tabs: ordered.flatMap((item) =>
      item.kind === "tab"
        ? [tabEntry(item)]
        : item.kind === "folder"
          ? item.tabs
          : []
    ),
  })
  const items = before.items.filter((item) => !ids.includes(item.id))
  items.splice(
    Math.min(
      before.items.findIndex((item) => ids.includes(item.id)),
      items.length
    ),
    0,
    folder
  )
  return {
    items,
    layouts: Object.fromEntries(
      Object.entries(before.layouts).map(([columns, positions]) => {
        const remaining = Object.fromEntries(
          Object.entries(positions).filter(([id]) => !ids.includes(id))
        )
        const origin = ordered
          .map((item) => positions[item.id])
          .filter(Boolean)
          .sort((a, b) => a.y - b.y || a.x - b.x)[0]
        if (origin) remaining[folder.id] = origin
        return [columns, remaining]
      })
    ),
  }
}
