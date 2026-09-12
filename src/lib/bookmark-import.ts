import type { GridItem, TabItem } from "@/components/tab-grid/types"

export type ImportedBookmark = { name: string; url: string; folder: string }
export function mergeBookmarks(
  existing: GridItem[],
  bookmarks: ImportedBookmark[]
) {
  const items = [...existing]
  const seen = new Set(
    existing
      .flatMap((item) =>
        item.kind === "tab"
          ? [item.url]
          : item.kind === "folder"
            ? item.tabs.map((tab) => tab.url)
            : []
      )
      .map((url) => new URL(url).href)
  )
  let added = 0
  let duplicates = 0
  for (const entry of bookmarks) {
    if (seen.has(entry.url)) {
      duplicates++
      continue
    }
    seen.add(entry.url)
    const tab: TabItem = {
      id: crypto.randomUUID(),
      kind: "tab",
      name: entry.name,
      url: entry.url,
      size: "small",
      color: "#6c8bd4",
    }
    if (!entry.folder) items.push(tab)
    else {
      const index = items.findIndex(
        (item) => item.kind === "folder" && item.name === entry.folder
      )
      const folder = items[index]
      if (folder?.kind === "folder")
        items[index] = { ...folder, tabs: [...folder.tabs, tab] }
      else
        items.push({
          id: crypto.randomUUID(),
          kind: "folder",
          name: entry.folder,
          color: "#6c8bd4",
          size: "large",
          tabs: [tab],
        })
    }
    added++
  }
  return { items, added, duplicates }
}
