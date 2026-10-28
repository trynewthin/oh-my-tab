export function dropRemovedGridItems<T>(items: readonly T[]): {
  items: T[]
  removedIds: Set<string>
} {
  const removedIds = new Set<string>()
  return {
    items: items.filter((item) => {
      if (!item || typeof item !== "object") return true
      const entry = item as { id?: unknown; kind?: unknown }
      if (entry.kind !== "bookmark-list" && entry.kind !== "search-full")
        return true
      if (typeof entry.id === "string") removedIds.add(entry.id)
      return false
    }),
    removedIds,
  }
}
