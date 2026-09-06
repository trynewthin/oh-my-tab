import type { GridItem, TabItem } from "@/components/tab-grid/types"

export type ImportedBookmark = { name: string; url: string; folder: string }
export function parseBookmarkHtml(html: string) {
  const doc = new DOMParser().parseFromString(html, "text/html")
  if (!doc.querySelector("dl"))
    throw new Error("请选择浏览器导出的书签 HTML 文件")
  const bookmarks: ImportedBookmark[] = []
  let invalid = 0
  for (const anchor of doc.querySelectorAll("dl a")) {
    let url: URL
    try {
      url = new URL(anchor.getAttribute("href") ?? "")
      if (!["http:", "https:"].includes(url.protocol))
        throw new Error("Unsupported URL")
    } catch {
      invalid++
      continue
    }
    const path: string[] = []
    let list = anchor.closest("dl")
    while (list) {
      const parent = list.parentElement
      const heading =
        parent?.tagName === "DT"
          ? Array.from(parent.children).find((child) => child.tagName === "H3")
          : list.previousElementSibling?.tagName === "H3"
            ? list.previousElementSibling
            : null
      if (heading?.textContent?.trim()) path.unshift(heading.textContent.trim())
      list = parent?.closest("dl") ?? null
    }
    bookmarks.push({
      name: anchor.textContent?.trim() || url.hostname,
      url: url.href,
      folder: path.join(" / "),
    })
  }
  if (!bookmarks.length && !invalid) throw new Error("文件中没有找到书签")
  return { bookmarks, invalid }
}

export function mergeBookmarks(
  existing: GridItem[],
  bookmarks: ImportedBookmark[]
) {
  const items = [...existing]
  const seen = new Set(
    existing
      .flatMap((item) =>
        item.kind === "tab" ? [item.url] : item.tabs.map((tab) => tab.url)
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
