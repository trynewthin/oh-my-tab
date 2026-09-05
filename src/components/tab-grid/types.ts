export type TabEntry = {
  id: string
  name: string
  url: string
  size?: "small" | "medium"
  color?: string
  dynamicEffect?: boolean
}

export type TabItem = TabEntry & {
  kind: "tab"
  size: "small" | "medium"
  color: string
}

export type FolderItem = {
  id: string
  kind: "folder"
  name: string
  size: "small" | "large" | "tall"
  color: string
  tabs: TabEntry[]
  dynamicEffect?: boolean
}

export type GridItem = TabItem | FolderItem

export function normalizeTabUrl(value: string): string | null {
  try {
    const raw = value.trim()
    if (!raw) return null
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
    )
    return ["http:", "https:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
