import { normalizeTabUrl, type GridItem, type TabEntry } from "@/lib/grid/types"

export function findBookmarkByUrl(
  items: GridItem[],
  url: string
): { entry: TabEntry; folderId?: string; slotId?: string } | undefined {
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
    } else if (item.kind === "button-slot") {
      const entry = item.controls.find(
        (control) =>
          control.kind === "site" && normalizeTabUrl(control.url) === address
      )
      if (entry?.kind === "site") return { entry, slotId: item.id }
    }
  }
}
