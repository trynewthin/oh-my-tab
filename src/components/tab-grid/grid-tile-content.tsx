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
