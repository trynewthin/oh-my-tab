import Todo from "./todo"
import Calendar from "./calendar"
import {
  canvasDimensions,
  resizeDots,
  displayDots,
} from "@/lib/grid/dot-canvas-data"
import Ecosystem from "./ecosystem"
import DotArt from "./dot-art"
import TabBackground from "./tab-background"
import TabUI from "./tab-ui"
import ComponentBackground from "./shared/component-background"
import FolderUI from "./folder-ui"
import FolderTabRow from "./folder-tab-row"
import TemplateTile from "./template/tile"
import SearchTile from "./search-tile"
import ActionButton from "./action-button"
import ComponentConfiguration from "./component-configuration"
import EcosystemConfiguration from "./ecosystem-configuration"
import DotCanvasConfiguration from "./dot-canvas-configuration"
import { createCatalogComponent } from "@/lib/grid/factory"
import type { ReactNode } from "react"
import {
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import type { GridItem, TabEntry, TodoTask } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

/**
 * Single dispatch surface for every widget kind. Each rendering mode owns one
 * exhaustive switch over the kind union, so adding or removing a registry kind
 * without a case is a compile error and no dispatch path falls through
 * silently.
 */

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
}

/** Same fields GridTileContent accepted; one case per grid kind. */
export function WidgetTile({
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
  switch (item.kind) {
    case "button":
      return <ActionButton item={item} preview={preview} />
    case "search-minimal":
    case "search-full":
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
        <>
          <TabBackground
            item={item}
            animated={!!item.dynamicEffect}
            entrance={!preview}
          />
          <TabUI item={item} preview={preview} />
        </>
      )
    case "folder":
      return (
        <>
          <ComponentBackground
            color={item.color}
            animated={!!item.dynamicEffect}
          />
          <FolderUI
            item={item}
            onOpen={onOpen}
            preview={preview}
            tabs={folderTabs}
          />
        </>
      )
  }
  return assertNever(item)
}

/** Existing-item editor routing; search kinds have no editor surface. */
export function WidgetEditor({
  item,
  onClose,
  onSaved,
}: {
  item: GridItem
  onClose: () => void
  onSaved: () => void
}): ReactNode {
  switch (item.kind) {
    case "search-minimal":
    case "search-full":
      return null
    case "dot-canvas":
      return (
        <DotCanvasConfiguration
          item={item}
          onClose={onClose}
          onSaved={onSaved}
        />
      )
    case "ecosystem":
      return (
        <EcosystemConfiguration
          item={item}
          onClose={onClose}
          onSaved={onSaved}
        />
      )
    case "tab":
    case "folder":
    case "todo":
    case "calendar":
    case "template":
    case "button":
      return (
        <ComponentConfiguration
          item={item}
          onClose={onClose}
          onSaved={onSaved}
        />
      )
  }
  return assertNever(item)
}

/** Catalog previews use the same content and size variants as home tiles. */
export function WidgetCatalogPreview({
  kind,
  size,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
}): ReactNode {
  const { t } = useTranslation()
  const item = createCatalogComponent(kind, size)
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
  return <WidgetTile item={item} preview onOpen={() => {}} />
}
