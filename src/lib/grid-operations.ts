import type { GridItem } from "@/components/tab-grid/types"
import type { GridPositions } from "@/components/tab-grid/grid-layout"
type GridData = {
  items: GridItem[]
  layouts: Record<number, GridPositions>
  lastLayoutColumns?: number
}

export function groupComponents(before: GridData, ids: string[], name: string) {
  const selected = before.items.filter((item) => ids.includes(item.id))
  if (selected.length < 2 || !name.trim()) return null
  const layout = before.layouts[before.lastLayoutColumns ?? 0] ?? {}
  selected.sort(
    (a, b) =>
      (layout[a.id]?.y ?? 0) - (layout[b.id]?.y ?? 0) ||
      (layout[a.id]?.x ?? 0) - (layout[b.id]?.x ?? 0)
  )
  const folder: GridItem = {
    id: crypto.randomUUID(),
    kind: "folder",
    name: name.trim(),
    size: "large",
    color: selected[0].color,
    tabs: selected.flatMap((item) =>
      item.kind === "tab" ? [item] : item.tabs
    ),
    dynamicEffect: false,
  }
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
        const origin = selected
          .map((item) => positions[item.id])
          .filter(Boolean)
          .sort((a, b) => a.y - b.y || a.x - b.x)[0]
        if (origin) remaining[folder.id] = origin
        return [columns, remaining]
      })
    ),
  }
}
