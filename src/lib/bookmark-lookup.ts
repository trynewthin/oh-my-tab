import {
  normalizeTabUrl,
  type GridItem,
  type TabEntry,
} from "@/components/tab-grid/types"

export function findBookmarkByUrl(
  items: GridItem[],
  url: string
): { entry: TabEntry; folderId?: string } | undefined {
  const address = normalizeTabUrl(url)
  if (!address) return
  for (const item of items) {
    if (item.kind === "tab") {
      if (normalizeTabUrl(item.url) === address) return { entry: item }
    } else if (item.kind === "folder") {
      const entry = item.tabs.find(
        (tab) => normalizeTabUrl(tab.url) === address
      )
      if (entry) return { entry, folderId: item.id }
    }
  }
}
