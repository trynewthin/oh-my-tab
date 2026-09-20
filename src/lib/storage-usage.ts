export type StorageCategory =
  | "icons"
  | "unused-images"
  | "background"
  | "bookmarks"
  | "preferences"
  | "garden"
  | "webdav"
  | "system"
export const storageCategories: {
  id: StorageCategory
  labelKey: string
  clearable: boolean
}[] = [
  { id: "icons", labelKey: "settings.cache.categories.icons", clearable: true },
  {
    id: "unused-images",
    labelKey: "settings.cache.categories.unusedImages",
    clearable: true,
  },
  {
    id: "background",
    labelKey: "settings.cache.categories.background",
    clearable: true,
  },
  {
    id: "bookmarks",
    labelKey: "settings.cache.categories.bookmarks",
    clearable: true,
  },
  {
    id: "preferences",
    labelKey: "settings.cache.categories.preferences",
    clearable: true,
  },
  {
    id: "garden",
    labelKey: "settings.cache.categories.garden",
    clearable: true,
  },
  {
    id: "webdav",
    labelKey: "settings.cache.categories.webdav",
    clearable: true,
  },
  {
    id: "system",
    labelKey: "settings.cache.categories.system",
    clearable: false,
  },
]
export function storedState(value: unknown): Record<string, unknown> {
  if (typeof value !== "string") return {}
  try {
    return JSON.parse(value)?.state ?? {}
  } catch {
    return {}
  }
}
export function categoryFor(key: string, background: unknown): StorageCategory {
  if (key.startsWith("cache:")) return "icons"
  if (key.startsWith("asset:"))
    return key === background ? "background" : "unused-images"
  if (key === "omt.tab-grid") return "bookmarks"
  if (
    ["omt.home-settings", "omt.theme-mode", "omt.search-engines"].includes(key)
  )
    return "preferences"
  if (key === "omt.garden") return "garden"
  if (key === "omt.webdav" || key === "omt.sync-provider") return "webdav"
  return "system"
}
export function valueBytes(value: unknown): number {
  if (value instanceof Blob) return value.size
  if (typeof value === "string")
    return new TextEncoder().encode(JSON.stringify(value)).length
  if (value && typeof value === "object")
    return (
      2 +
      Object.entries(value).reduce(
        (sum, [key, item]) =>
          sum +
          new TextEncoder().encode(JSON.stringify(key)).length +
          valueBytes(item) +
          2,
        0
      )
    )
  return new TextEncoder().encode(JSON.stringify(value) ?? "").length
}
export type StorageUsageRow = {
  id: StorageCategory
  labelKey: string
  clearable: boolean
  bytes: number
  count: number
  clearableBytes: number
}

export function summarizeStorage(
  entries: Record<string, unknown>
): StorageUsageRow[] {
  const background = storedState(entries["omt.home-settings"]).backgroundImage
  const rows = storageCategories.map((category) => ({
    ...category,
    bytes: 0,
    count: 0,
    clearableBytes: 0,
  }))
  for (const [key, value] of Object.entries(entries)) {
    if (value === undefined || value === null) continue
    const row = rows.find((row) => row.id === categoryFor(key, background))!
    const bytes = new TextEncoder().encode(key).length + valueBytes(value)
    row.bytes += bytes
    const createdAt = (value as { createdAt?: number } | null)?.createdAt
    if (
      row.clearable &&
      !(
        row.id === "unused-images" &&
        createdAt &&
        createdAt > Date.now() - 86400000
      )
    )
      row.clearableBytes += bytes
    row.count++
  }
  return rows
}
export function formatStorageBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}
