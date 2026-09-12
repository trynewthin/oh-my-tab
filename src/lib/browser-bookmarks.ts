import type { ImportedBookmark } from "./bookmark-import"

export type BrowserBookmarkNode = {
  id: string
  title: string
  url?: string
  children?: BrowserBookmarkNode[]
}
type BookmarkApi = {
  permissions?: {
    request(options: { permissions: string[] }): Promise<boolean>
  }
  bookmarks?: { getTree(): Promise<BrowserBookmarkNode[]> }
}
const browserApi = () =>
  (globalThis as typeof globalThis & { chrome?: BookmarkApi }).chrome

export const supportsBrowserBookmarks = () =>
  location.protocol === "chrome-extension:" &&
  typeof browserApi()?.permissions?.request === "function"

export function parseBookmarkTree(tree: BrowserBookmarkNode[]) {
  const bookmarks: ImportedBookmark[] = []
  let invalid = 0
  const stack = tree.map((node) => ({ node, path: [] as string[] })).reverse()
  while (stack.length) {
    const { node, path } = stack.pop()!
    if (node.url !== undefined) {
      try {
        const url = new URL(node.url)
        if (!["http:", "https:"].includes(url.protocol)) {
          invalid++
          continue
        }
        bookmarks.push({
          name: node.title.trim() || url.hostname,
          url: url.href,
          folder: path.join(" / "),
        })
      } catch {
        invalid++
      }
      continue
    }
    const title = node.title.trim()
    const nextPath = node.id !== "0" && title ? [...path, title] : path
    for (let i = (node.children?.length ?? 0) - 1; i >= 0; i--)
      stack.push({ node: node.children![i], path: nextPath })
  }
  return { bookmarks, invalid }
}

export async function readBrowserBookmarks() {
  if (!supportsBrowserBookmarks())
    throw new Error("请在 Chrome 或 Edge 扩展中导入浏览器书签")
  // Request directly from the click handler to preserve the user gesture.
  const granted = await browserApi()!.permissions!.request({
    permissions: ["bookmarks"],
  })
  if (!granted) throw new Error("未获得书签访问权限，未导入任何书签")
  const bookmarks = browserApi()?.bookmarks
  if (!bookmarks?.getTree)
    throw new Error("书签读取功能不可用，请重新加载扩展后重试")
  return parseBookmarkTree(await bookmarks.getTree())
}
