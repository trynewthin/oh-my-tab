import type { GridPosition, GridPositions } from "@/lib/grid/grid-layout"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"

export const FOLDER_GAP_ID = "__folder-gap__"
export const TODO_GAP_ID = "__todo-gap__"

export type Point = { x: number; y: number }
export type Bounds = {
  left: number
  top: number
  width: number
  height: number
}

export type DragSession = {
  columns: number
  item: GridItem
  width: number
  height: number
  origin: GridPosition
  grabOffset: Point
  pointerOrigin: Point
  mouse: boolean
  positions: GridPositions
  sourceFolderId?: string
  sourceFolderIndex?: number
  sourceFolderColor?: string
  sourceTodoId?: string
  sourceTodoIndex?: number
  todoTask?: TodoTask
  sourceSurface?: "preview" | "dialog"
  dialogBounds?: Bounds
  dialogExited: boolean
}

export type Intent =
  | { kind: "none" }
  | {
      kind: "grid"
      position: GridPosition
      holdLayout: boolean
      releaseProgress: number
      ready: boolean
    }
  | {
      kind: "folder"
      folderId: string
      ready: boolean
      progress: number
      releaseProgress: number
      color: string
    }
  | {
      kind: "reorder"
      folderId: string
      index: number
      releaseProgress: number
    }
  | {
      kind: "todo-reorder"
      todoId: string
      index: number
      releaseProgress: number
    }

export function sameDragIntent(a: Intent, b: Intent): boolean {
  switch (a.kind) {
    case "none":
      return b.kind === "none"
    case "grid":
      return (
        b.kind === "grid" &&
        a.position.x === b.position.x &&
        a.position.y === b.position.y &&
        a.holdLayout === b.holdLayout &&
        a.releaseProgress === b.releaseProgress &&
        a.ready === b.ready
      )
    case "folder":
      return (
        b.kind === "folder" &&
        a.folderId === b.folderId &&
        a.ready === b.ready &&
        a.progress === b.progress &&
        a.releaseProgress === b.releaseProgress &&
        a.color === b.color
      )
    case "reorder":
      return (
        b.kind === "reorder" &&
        a.folderId === b.folderId &&
        a.index === b.index &&
        a.releaseProgress === b.releaseProgress
      )
    case "todo-reorder":
      return (
        b.kind === "todo-reorder" &&
        a.todoId === b.todoId &&
        a.index === b.index &&
        a.releaseProgress === b.releaseProgress
      )
  }
}

export function previewFolderTabs(
  tabs: TabEntry[],
  tabId: string | undefined,
  index: number
) {
  if (!tabId) return tabs
  const remaining = tabs.filter((tab) => tab.id !== tabId)
  const next = [...remaining]
  next.splice(Math.max(0, Math.min(index, next.length)), 0, {
    id: FOLDER_GAP_ID,
    name: "",
    url: "",
  })
  return next
}

export function previewTodoTasks(
  tasks: TodoTask[],
  taskId: string | undefined,
  index: number
) {
  if (!taskId) return tasks
  const remaining = tasks.filter((task) => task.id !== taskId)
  const next = [...remaining]
  next.splice(Math.max(0, Math.min(index, next.length)), 0, {
    id: TODO_GAP_ID,
    text: "",
    done: false,
  })
  return next
}

export function reorderTodoTasks(
  tasks: TodoTask[],
  task: TodoTask,
  index: number
) {
  const remaining = tasks.filter((entry) => entry.id !== task.id)
  remaining.splice(Math.max(0, Math.min(index, remaining.length)), 0, task)
  return remaining
}
