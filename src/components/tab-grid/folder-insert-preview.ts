import { createContext, useContext } from "react"
import type { TabEntry } from "./types"

export type FolderInsertPreview = {
  folderId: string
  tabId: string
  index: number
}

export const FOLDER_INSERT_GAP_CLASS =
  "rounded-2xl border-2 border-dashed border-primary/25 bg-primary/5"

export const FolderInsertPreviewContext =
  createContext<FolderInsertPreview | null>(null)

export function useFolderInsertPreview() {
  return useContext(FolderInsertPreviewContext)
}

export function previewFolderEntries(
  tabs: TabEntry[],
  preview: FolderInsertPreview | null,
  folderId: string
): Array<{ key: string; tab?: TabEntry; gap?: true }> {
  if (!preview || preview.folderId !== folderId) {
    return tabs.map((tab) => ({ key: tab.id, tab }))
  }
  const remaining = tabs.filter((tab) => tab.id !== preview.tabId)
  const index = Math.max(0, Math.min(remaining.length, preview.index))
  return [
    ...remaining.slice(0, index).map((tab) => ({ key: tab.id, tab })),
    { key: "insert-gap", gap: true as const },
    ...remaining.slice(index).map((tab) => ({ key: tab.id, tab })),
  ]
}
