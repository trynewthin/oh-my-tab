import { storageOptions } from "@/lib/storage"
import { groupComponents, resolveGroupAction } from "@/lib/grid/grid-operations"
import { mergeBookmarks, type ImportedBookmark } from "@/lib/bookmark-import"
import {
  GRID_COLUMNS,
  ensureLayoutColumns,
  itemWidth,
} from "@/lib/grid/grid-layout"
import { toast } from "@/stores/toast-store"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type GridItem, type TabEntry, type TodoTask } from "@/lib/grid/types"
import { validGridItem } from "@/lib/grid/validation"
import { bookmarkItemFactory } from "@/lib/grid/factory"
import {
  addFolderTab,
  describeRemoval,
  randomizeItemColor,
  removeItems,
  resizeItem,
  restoreItems,
  setItemDynamicEffect,
  updateFolderTab,
  updateTodoTasks,
  upsertBookmark,
  upsertItem,
} from "@/lib/grid/operations"

import { MOCK_DATA_VERSION } from "@/lib/grid/mock-version"
import { mockGridItems } from "@/lib/grid/mock-data"

// Kept as a function so production builds can tree-shake the mock item list
// entirely: a top-level `import.meta.env.DEV ? mockGridItems : []` constant is
// captured by `merge` below and survives dead-code elimination.
const devInitialItems = (): GridItem[] =>
  import.meta.env.DEV ? mockGridItems((key) => i18n.t(key)) : []

import type { GridPosition, GridPositions } from "@/lib/grid/grid-layout"

import { transferTab, type TabTransfer } from "@/lib/grid/tab-transfer"

import { randomComponentColor } from "@/lib/component-colors"
import { i18n } from "@/i18n"

type TabGridState = {
  updateTodoTasks: (
    id: string,
    change: (tasks: TodoTask[]) => TodoTask[]
  ) => void
  lastLayoutColumns?: number
  ensureLayout: (columns: number) => void
  mockDataVersion: number
  layouts: Record<number, GridPositions>
  setLayout: (columns: number, positions: GridPositions) => void
  transferTab: (move: TabTransfer) => void
  items: GridItem[]

  setItemDynamicEffect: (id: string, enabled: boolean) => void
  randomizeItemColor: (id: string) => void
  resizeItem: (id: string, size: GridItem["size"]) => void
  removeItem: (id: string) => void
  removeItems: (ids: string[]) => void
  groupItems: (ids: string[], name?: string) => boolean
  importBookmarks: (bookmarks: ImportedBookmark[]) => {
    added: number
    duplicates: number
  }
  saveItem: (item: GridItem) => void
  upsertBookmark: (name: string, url: string) => void
  updateFolderTab: (
    folderId: string,
    tabId: string,
    changes: Pick<TabEntry, "name" | "url">
  ) => void
  addFolderTab: (folderId: string, tab: TabEntry) => void
}

// Normalizes the persisted blob (any version) into the shape this store keeps.
// Shared by migrate() and merge() so a legacy v0 blob and a current blob are
// validated and clamped by exactly one code path. Throws on invalid items so a
// corrupt blob is rejected instead of silently overwriting good data.
function sanitizePersisted(persisted: unknown): {
  items: GridItem[]
  layouts: Record<number, GridPositions>
  mockDataVersion: number
} {
  const items = (persisted as { items?: unknown } | null)?.items
  if (
    items !== undefined &&
    (!Array.isArray(items) || !items.every(validGridItem))
  ) {
    throw new Error(i18n.t("grid.error.corruptGrid"))
  }
  const storedItems: GridItem[] = Array.isArray(items) ? items : []
  const savedLayouts = (
    persisted as { layouts?: Record<string, unknown> } | null
  )?.layouts
  const layouts: Record<number, GridPositions> = {}
  for (const columns of GRID_COLUMNS) {
    const layout = savedLayouts?.[columns]
    if (!layout || typeof layout !== "object") continue
    layouts[columns] = Object.fromEntries(
      Object.entries(layout).filter(([id, value]) => {
        if (
          !value ||
          !Number.isInteger((value as GridPosition).x) ||
          !Number.isInteger((value as GridPosition).y)
        )
          return false
        const { x, y } = value as GridPosition
        const item = storedItems.find((entry) => entry.id === id)
        const width = item ? itemWidth(item, columns) : 4
        return x >= 0 && x <= columns - width && y >= 0 && y <= 500
      })
    )
  }
  const mockDataVersion =
    (persisted as { mockDataVersion?: number } | null)?.mockDataVersion ?? 0
  return {
    items: Array.isArray(items) ? storedItems : devInitialItems(),
    layouts,
    mockDataVersion,
  }
}

export const useTabGridStore = create<TabGridState>()(
  persist(
    (set, get) => ({
      mockDataVersion: import.meta.env.DEV ? MOCK_DATA_VERSION : 0,
      layouts: {},
      ensureLayout: (columns) =>
        set((state) => ensureLayoutColumns(state, columns) ?? state),
      setLayout: (columns, positions) =>
        set((state) => ({
          layouts: { ...state.layouts, [columns]: positions },
          lastLayoutColumns: columns,
        })),
      items: devInitialItems(),
      updateTodoTasks: (id, change) =>
        set((state) => ({ items: updateTodoTasks(state.items, id, change) })),
      transferTab: (move) => set((state) => transferTab(state, move)),
      setItemDynamicEffect: (id, enabled) =>
        set((state) => ({
          items: setItemDynamicEffect(state.items, id, enabled),
        })),
      randomizeItemColor: (id) =>
        set((state) => ({
          items: randomizeItemColor(state.items, id, randomComponentColor),
        })),
      resizeItem: (id, size) =>
        set((state) => ({ items: resizeItem(state.items, id, size) })),
      removeItem: (id) => get().removeItems([id]),
      removeItems: (ids) => {
        const before = get()
        const result = removeItems(before, ids)
        if (!result) return
        const previous = { items: before.items, layouts: before.layouts }
        const removed = result.removed
        set({ items: result.items, layouts: result.layouts })
        toast(describeRemoval(removed), "warning", {
          label: i18n.t("grid.notify.undo"),
          run: () => {
            set((state) => restoreItems(state, removed, previous))
            toast(
              i18n.t("grid.notify.restoredCount", { count: removed.length }),
              "success"
            )
          },
        })
      },
      groupItems: (ids, name) => {
        const state = get()
        const selected = state.items.filter((item) => ids.includes(item.id))
        const action = resolveGroupAction(selected)
        const next = groupComponents(state, ids, name)
        if (!next) return false
        set(next)
        if (action.kind === "move") {
          const folder = selected.find((item) => item.id === action.folderId)
          toast(
            i18n.t("grid.notify.movedIntoFolder", {
              name:
                folder && folder.kind === "folder"
                  ? folder.name
                  : i18n.t("grid.component.folder.label"),
            }),
            "success"
          )
        } else
          toast(
            i18n.t("grid.notify.createdFolder", { name: (name ?? "").trim() }),
            "success"
          )
        return true
      },
      importBookmarks: (bookmarks) => {
        const result = mergeBookmarks(
          get().items,
          bookmarks,
          bookmarkItemFactory
        )
        if (result.added) set({ items: result.items })
        return { added: result.added, duplicates: result.duplicates }
      },
      upsertBookmark: (name, url) => {
        const { items, result } = upsertBookmark(get().items, name, url)
        if (result.kind === "invalid")
          throw new Error(i18n.t("grid.notify.invalidBookmark"))
        set({ items })
      },
      saveItem: (item) =>
        set((state) => ({ items: upsertItem(state.items, item) })),
      updateFolderTab: (folderId, tabId, changes) =>
        set((state) => ({
          items: updateFolderTab(state.items, folderId, tabId, changes),
        })),
      addFolderTab: (folderId, tab) =>
        set((state) => ({
          items: addFolderTab(state.items, folderId, tab),
        })),
    }),
    {
      ...storageOptions(),
      name: "omt.tab-grid",
      version: 1,
      // v0 persisted blobs had no schema version. Reuse the same sanitizer for
      // both migration and merge so a v0 blob and a fresh blob are normalized
      // identically; anything invalid throws and preserves the stored data.
      migrate: (persisted) => sanitizePersisted(persisted),
      // lastLayoutColumns stays tab-local: persisting it makes tabs with
      // different column counts overwrite each other in a ping-pong loop.
      partialize: ({ items, layouts, mockDataVersion }) => ({
        items,
        layouts,
        mockDataVersion,
      }),
      merge: (persisted, current) => {
        const clean = sanitizePersisted(persisted)
        return {
          ...current,
          ...clean,
          mockDataVersion: import.meta.env.DEV
            ? MOCK_DATA_VERSION
            : clean.mockDataVersion,
        }
      },
    }
  )
)
