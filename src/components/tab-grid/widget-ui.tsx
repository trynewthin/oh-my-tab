import Todo from "./todo"
import Calendar from "./calendar"
import { canvasDimensions, resizeDots } from "@/lib/grid/dot-canvas-data"
import Ecosystem from "./ecosystem"
import DotArt from "./dot-art"
import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import TabSurface from "./tab-surface"
import ComponentBackground from "./shared/component-background"
import FolderUI from "./folder-ui"
import FolderBorder from "./folder-border"
import FolderTabRow from "./folder-tab-row"
import TemplateTile from "./template/tile"
import SearchTile from "./search-tile"
import ActionButton from "./action-button"
import ButtonSlot from "./button-slot"
import UtilityWidgetTile from "./utility-widget-tile"
import { isUtilityWidget } from "@/lib/grid/utility-types"
import { createCatalogComponent } from "@/lib/grid/factory"
import type { ReactNode } from "react"
import {
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

function assertNever(value: never): never {
  throw new Error(`Unhandled kind: ${String(value)}`)
}

function DotCanvasTile({
  item,
  onOpen,
}: {
  item: Extract<GridItem, { kind: "dot-canvas" }>
  onOpen: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      aria-label={t("grid.dotCanvas.editCanvas", { name: item.name })}
      onClick={onOpen}
      className="flex h-full w-full flex-col rounded-[inherit] bg-transparent text-left"
    >
      <div className="min-h-0 w-full flex-1 overflow-hidden rounded-[inherit]">
        <DotArt
          pixels={resizeDots(
            item.pixels,
            item.pixelColumns,
            canvasDimensions(item.size).columns,
            canvasDimensions(item.size).rows
          )}
          pixelColumns={canvasDimensions(item.size).columns}
        />
      </div>
    </button>
  )
}

export function WidgetTile({
  item,
  onOpen,
  preview = false,
  sample = false,
  compactTab = false,
  folderTabs,
  todoTasks,
  editing = false,
  onAddControl,
  onRemoveControl,
}: {
  item: GridItem
  onOpen: () => void
  preview?: boolean
  sample?: boolean
  compactTab?: boolean
  folderTabs?: TabEntry[]
  todoTasks?: TodoTask[]
  editing?: boolean
  onAddControl?: () => void
  onRemoveControl?: (controlId: string, anchor: HTMLElement) => void
}) {
  if (isUtilityWidget(item))
    return (
      <UtilityWidgetTile
        item={item}
        onOpen={onOpen}
        preview={preview}
        sample={sample}
      />
    )

  switch (item.kind) {
    case "button-slot":
      return (
        <ButtonSlot
          item={item}
          preview={preview}
          editing={editing}
          onAddControl={onAddControl}
          onRemoveControl={onRemoveControl}
        />
      )
    case "button":
      return <ActionButton item={item} preview={preview} />
    case "search-minimal":
      return <SearchTile item={item} preview={preview} />
    case "todo":
      return <Todo item={item} preview={preview} tasks={todoTasks} />
    case "calendar":
      return <Calendar item={item} preview={preview} />
    case "ecosystem":
      return <Ecosystem item={item} preview={preview} onEdit={onOpen} />
    case "template":
      return <TemplateTile item={item} preview={preview} />
    case "dot-canvas":
      return <DotCanvasTile item={item} onOpen={onOpen} />
    case "tab":
      return compactTab ? (
        <FolderTabRow
          tab={item}
          color={item.color}
          folderId={item.id}
          index={0}
          animated={!!item.dynamicEffect}
          preview
        />
      ) : (
        <TabSurface size={item.size}>
          <TabBackground
            item={item}
            animated={!!item.dynamicEffect}
            entrance={!preview}
          />
          <TabUI item={item} preview={preview} />
        </TabSurface>
      )
    case "folder":
      return (
        <>
          <ComponentBackground color={item.color} />
          <FolderUI
            item={item}
            onOpen={onOpen}
            preview={preview}
            tabs={folderTabs}
          />
          <FolderBorder />
        </>
      )
  }
  return assertNever(item)
}

export function WidgetCatalogPreview({
  kind,
  size,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
}): ReactNode {
  const { t } = useTranslation()
  const item = createCatalogComponent(kind, size)
  if (item.kind === "button-slot")
    item.controls = [
      {
        id: "slot-preview-components",
        kind: "system",
        action: "open-components",
      },
      { id: "slot-preview-settings", kind: "system", action: "open-settings" },
    ]
  if (item.kind === "todo") {
    item.tasks = [
      { id: "1", text: t("grid.dialog.previewTaskPlan"), done: true },
      { id: "2", text: t("grid.dialog.previewTaskRead"), done: false },
    ]
  }
  if (item.kind === "dot-canvas") {
    const pixels = Array.from({ length: 576 }, (_, i) => {
      const x = i % 24
      const y = Math.floor(i / 24)
      if (x < 3 || x > 20 || y < 3 || y > 20) return ""
      if (x >= 16 && x <= 18 && y >= 5 && y <= 7) return "#f4c76b"
      if (y >= 12 + Math.abs(x - 15) && y <= 20) return "#3291ff"
      if (y >= 8 + Math.abs(x - 8) && y <= 20) return "#75c8e8"
      return ""
    })
    const dimensions = canvasDimensions(item.size)
    item.pixels = resizeDots(pixels, 24, dimensions.columns, dimensions.rows)
    item.pixelColumns = dimensions.columns
  }
  return <WidgetTile item={item} preview sample onOpen={() => {}} />
}
