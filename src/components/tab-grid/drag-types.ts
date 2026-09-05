export type FolderTabDragData = {
  type: "folder-tab"
  tabId: string
  folderId: string
  surface: "preview" | "dialog"
  getElement: () => HTMLElement | null
}
