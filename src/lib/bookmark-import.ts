import type { FolderItem, GridItem, TabItem } from "@/lib/grid/types"

export type ImportedBookmark = { name: string; url: string; folder: string }
export type BookmarkItemFactory = {
  createTab: (input: { name: string; url: string }) => TabItem
  createFolder: (input: { name: string; tabs: TabItem[] }) => FolderItem
}
export function mergeBookmarks(
  existing: GridItem[],
  bookmarks: ImportedBookmark[],
  factory: BookmarkItemFactory
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
    const tab = factory.createTab({
      name: entry.name,
      url: entry.url,
    })
    if (!entry.folder) items.push(tab)
    else {
      const index = items.findIndex(
        (item) => item.kind === "folder" && item.name === entry.folder
      )
      const folder = items[index]
      if (folder?.kind === "folder")
        items[index] = { ...folder, tabs: [...folder.tabs, tab] }
      else
        items.push(
          factory.createFolder({
            name: entry.folder,
            tabs: [tab],
          })
        )
    }
    added++
  }
  return { items, added, duplicates }
}
