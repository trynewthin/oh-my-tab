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
import ComponentConfiguration from "./component-configuration"
import EcosystemConfiguration from "./ecosystem-configuration"
import DotCanvasConfiguration from "./dot-canvas-configuration"
import type { ReactNode } from "react"
import {
  componentDefaultName,
  getComponentDefinition,
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

/** Catalog card bodies; the scaling container stays in CatalogComponentPreview. */
export function WidgetCatalogPreview({
  kind,
  size,
  detail = false,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
  detail?: boolean
}): ReactNode {
  const { t } = useTranslation()
  switch (kind) {
    case "search-minimal": {
      const item: Extract<GridItem, { kind: "search-minimal" }> = {
        id: `${kind}-preview`,
        kind,
        name: componentDefaultName(kind, t),
        size: "small",
        color: getComponentDefinition(kind).defaultColor,
      }
      return (
        <div
          className={`${detail ? "w-full" : "mx-auto w-full max-w-60"} overflow-hidden rounded-2xl`}
          style={{ height: detail ? 56 : 40 }}
        >
          <SearchTile preview item={item} />
        </div>
      )
    }
    case "search-full": {
      const item: Extract<GridItem, { kind: "search-full" }> = {
        id: `${kind}-preview`,
        kind,
        name: componentDefaultName(kind, t),
        size: "medium",
        color: getComponentDefinition(kind).defaultColor,
      }
      return (
        <div
          className={`${detail ? "w-full" : "mx-auto w-full max-w-60"} overflow-hidden rounded-2xl`}
          style={{ height: detail ? 112 : 80 }}
        >
          <SearchTile preview item={item} />
        </div>
      )
    }
    case "todo": {
      const resolved = size ?? getComponentDefinition(kind).defaultSize
      return (
        <div
          className={`mx-auto w-full max-w-60 overflow-hidden rounded-2xl border ${resolved === "small" ? "aspect-[4/1]" : resolved === "medium" ? "aspect-[2/1]" : "aspect-square"}`}
        >
          <Todo
            preview
            item={{
              id: "todo-preview",
              kind: "todo",
              name: componentDefaultName(kind, t),
              size:
                resolved === "small" || resolved === "medium"
                  ? resolved
                  : "large",
              color: getComponentDefinition(kind).defaultColor,
              tasks: [
                { id: "1", text: t("grid.dialog.previewTaskPlan"), done: true },
                {
                  id: "2",
                  text: t("grid.dialog.previewTaskRead"),
                  done: false,
                },
              ],
            }}
          />
        </div>
      )
    }
    case "calendar": {
      const resolved = size ?? getComponentDefinition(kind).defaultSize
      return (
        <div
          className={`mx-auto w-full overflow-hidden rounded-2xl border ${!detail ? "aspect-square max-w-60" : resolved === "small" ? "aspect-[4/1] max-w-60" : resolved === "medium" ? "aspect-square max-w-28" : "aspect-square max-w-60"}`}
        >
          <Calendar
            preview
            item={{
              id: "calendar-preview",
              kind: "calendar",
              name: componentDefaultName(kind, t),
              size:
                resolved === "small" || resolved === "medium"
                  ? resolved
                  : "large",
              color: getComponentDefinition(kind).defaultColor,
            }}
          />
        </div>
      )
    }
    case "ecosystem":
      return (
        <div
          className={
            detail
              ? "size-40 [&>div]:p-0"
              : "mx-auto aspect-square w-full max-w-60 [&>div]:p-0"
          }
        >
          <Ecosystem
            preview
            animated={false}
            item={{
              id: "ecosystem-preview",
              kind: "ecosystem",
              name: componentDefaultName(kind, t),
              size: "large",
              color: getComponentDefinition(kind).defaultColor,
              species: "flowers",
              plants: [],
            }}
          />
        </div>
      )
    case "dot-canvas":
      return (
        <div
          className={
            detail
              ? "flex size-40 items-center justify-center"
              : "mx-auto flex aspect-square w-full max-w-60 items-center justify-center"
          }
        >
          <div className="aspect-square w-full">
            <DotArt
              pixels={Array.from({ length: 576 }, (_, i) => {
                const x = i % 24
                const y = Math.floor(i / 24)
                if (x < 3 || x > 20 || y < 3 || y > 20) return ""
                if (x >= 16 && x <= 18 && y >= 5 && y <= 7) return "#f4c76b"
                if (y >= 12 + Math.abs(x - 15) && y <= 20) return "#3291ff"
                if (y >= 8 + Math.abs(x - 8) && y <= 20) return "#75c8e8"
                return ""
              })}
            />
          </div>
        </div>
      )
  }
  return assertNever(kind)
}
