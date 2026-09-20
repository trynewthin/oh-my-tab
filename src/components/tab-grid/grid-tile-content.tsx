import Todo from "./todo"
import Calendar from "./calendar"
import { canvasDimensions, resizeDots, displayDots } from "./dot-canvas-data"
import Ecosystem from "./ecosystem"
import DotArt from "./dot-art"
import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import ComponentBackground from "./shared/component-background"
import FolderUI from "./folder-ui"
import FolderTabRow from "./folder-tab-row"
import TemplateTile from "./template/tile"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

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
  const { t } = useTranslation()
  if (item.kind === "todo")
    return <Todo item={item} preview={preview} tasks={todoTasks} />
  if (item.kind === "calendar")
    return <Calendar item={item} preview={preview} />
  if (item.kind === "ecosystem")
    return <Ecosystem item={item} preview={preview} onEdit={onOpen} />
  if (item.kind === "template")
    return <TemplateTile item={item} preview={preview} />
  if (item.kind === "dot-canvas")
    return (
      <button
        type="button"
        aria-label={t("grid.dotCanvas.editCanvas", { name: item.name })}
        onClick={onOpen}
        className="flex h-full w-full flex-col rounded-[inherit] bg-transparent text-left"
      >
        <div className="min-h-0 w-full flex-1">
          <DotArt
            pixels={resizeDots(
              displayDots(item.pixels),
              item.pixelColumns ?? 24,
              canvasDimensions(item.size).columns,
              canvasDimensions(item.size).rows
            )}
            pixelColumns={canvasDimensions(item.size).columns}
          />
        </div>
      </button>
    )
  if (item.kind === "tab" && compactTab)
    return (
      <FolderTabRow
        tab={item}
        color={item.color}
        folderId={item.id}
        index={0}
        animated={!!item.dynamicEffect}
        preview
      />
    )
  return item.kind === "tab" ? (
    <>
      <TabBackground
        item={item}
        animated={!!item.dynamicEffect}
        entrance={!preview}
      />
      <TabUI item={item} preview={preview} />
    </>
  ) : (
    <>
      <ComponentBackground color={item.color} animated={!!item.dynamicEffect} />
      <FolderUI
        item={item}
        onOpen={onOpen}
        preview={preview}
        tabs={folderTabs}
      />
    </>
  )
}
