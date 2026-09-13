import Todo from "./todo"
import Calendar from "./calendar"
import { canvasDimensions, resizeDots, displayDots } from "./dot-canvas-data"
import Ecosystem from "./ecosystem"
import DotArt from "./dot-art"
import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import FolderBackground from "./folder-background"
import FolderUI from "./folder-ui"
import type { GridItem } from "./types"

export default function GridTileContent({
  item,
  onOpen,
  preview = false,
}: {
  item: GridItem
  onOpen: () => void
  preview?: boolean
}) {
  if (item.kind === "todo") return <Todo item={item} preview={preview} />
  if (item.kind === "calendar")
    return <Calendar item={item} preview={preview} />
  if (item.kind === "ecosystem")
    return <Ecosystem item={item} preview={preview} onEdit={onOpen} />
  if (item.kind === "dot-canvas")
    return (
      <button
        type="button"
        aria-label={`编辑点阵画布 ${item.name}`}
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
  return item.kind === "tab" ? (
    <>
      <TabBackground
        item={item}
        animated={!!item.dynamicEffect}
        entrance={!preview}
      />
      <TabUI item={item} />
    </>
  ) : (
    <>
      <FolderBackground color={item.color} animated={!!item.dynamicEffect} />
      <FolderUI item={item} onOpen={onOpen} preview={preview} />
    </>
  )
}
