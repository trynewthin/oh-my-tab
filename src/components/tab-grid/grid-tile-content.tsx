import { WidgetTile } from "./widget-ui"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"

export default function GridTileContent({
  item,
  onOpen,
  preview = false,
  compactTab = false,
  folderTabs,
  todoTasks,
}: {
  item: GridItem
  onOpen: () => void
  preview?: boolean
  compactTab?: boolean
  folderTabs?: TabEntry[]
  todoTasks?: TodoTask[]
}) {
  return (
    <WidgetTile
      item={item}
      onOpen={onOpen}
      preview={preview}
      compactTab={compactTab}
      folderTabs={folderTabs}
      todoTasks={todoTasks}
    />
  )
}
