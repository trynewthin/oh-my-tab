type CollectionDragData = {
  surface: "preview" | "dialog"
  getElement: () => HTMLElement | null
}

export type FolderTabDragData = CollectionDragData & {
  type: "folder-tab"
  tabId: string
  folderId: string
}

export type TodoTaskDragData = CollectionDragData & {
  type: "todo-task"
  taskId: string
  todoId: string
}

export type GridDragData = FolderTabDragData | TodoTaskDragData
