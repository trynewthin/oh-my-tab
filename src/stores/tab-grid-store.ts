import { storageOptions } from "@/lib/storage"
import { findBookmarkByUrl } from "@/lib/bookmark-lookup"
import { groupComponents, resolveGroupAction } from "@/lib/grid-operations"
import { mergeBookmarks, type ImportedBookmark } from "@/lib/bookmark-import"
import {
  GRID_COLUMNS,
  reconcileLayouts,
  deriveLayout,
  itemWidth,
} from "@/components/tab-grid/grid-layout"
import { toast } from "@/stores/toast-store"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  normalizeTabUrl,
  type GridItem,
  type TabEntry,
  type TodoTask,
} from "@/components/tab-grid/types"
import { validGridItem } from "@/components/tab-grid/model/validation"
import {
  bookmarkItemFactory,
  createTabItem,
} from "@/components/tab-grid/model/factory"
import {
  getComponentDefinition,
  isComponentSize,
  supportsComponentAction,
} from "@/components/tab-grid/model/registry"

import {
  mockGridItems,
  MOCK_DATA_VERSION,
} from "@/components/tab-grid/mock-data"

const initialItems = import.meta.env.DEV ? mockGridItems : []

import type { GridPositions } from "@/components/tab-grid/grid-layout"

import {
  transferTab,
  type TabTransfer,
} from "@/components/tab-grid/tab-transfer"

import { randomComponentColor } from "@/lib/component-colors"

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

export const useTabGridStore = create<TabGridState>()(
  persist(
    (set, get) => ({
      mockDataVersion: import.meta.env.DEV ? MOCK_DATA_VERSION : 0,
      layouts: {},
      ensureLayout: (columns) =>
        set((state) => {
          const layouts = reconcileLayouts(state.items, state.layouts)
          if (!layouts[columns]) {
            const sourceColumns =
              state.lastLayoutColumns && layouts[state.lastLayoutColumns]
                ? state.lastLayoutColumns
                : Object.keys(layouts)
                    .map(Number)
                    .sort(
                      (a, b) => Math.abs(a - columns) - Math.abs(b - columns)
                    )[0]
            layouts[columns] = deriveLayout(
              state.items,
              columns,
              layouts[sourceColumns] ?? {}
            )
          }
          const unchanged =
            Object.keys(layouts).length === Object.keys(state.layouts).length &&
            Object.entries(layouts).every(([key, layout]) => {
              const old = state.layouts[Number(key)]
              return (
                old &&
                Object.keys(layout).length === Object.keys(old).length &&
                Object.entries(layout).every(
                  ([id, position]) =>
                    old[id]?.x === position.x && old[id]?.y === position.y
                )
              )
            })
          return unchanged && state.lastLayoutColumns === columns
            ? state
            : { layouts, lastLayoutColumns: columns }
        }),
      setLayout: (columns, positions) =>
        set((state) => ({
          layouts: { ...state.layouts, [columns]: positions },
          lastLayoutColumns: columns,
        })),
      items: initialItems,
      updateTodoTasks: (id, change) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && item.kind === "todo"
              ? { ...item, tasks: change(item.tasks) }
              : item
          ),
        })),
      transferTab: (move) => set((state) => transferTab(state, move)),
      setItemDynamicEffect: (id, enabled) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id &&
            supportsComponentAction(item.kind, "dynamicEffect")
              ? { ...item, dynamicEffect: enabled }
              : item
          ),
        })),
      randomizeItemColor: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id && supportsComponentAction(item.kind, "randomColor")
              ? { ...item, color: randomComponentColor(item.color) }
              : item
          ),
        })),
      resizeItem: (id, size) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            return supportsComponentAction(item.kind, "resize") &&
              isComponentSize(item.kind, size)
              ? ({ ...item, size } as GridItem)
              : item
          }),
        })),
      removeItem: (id) => get().removeItems([id]),
      removeItems: (ids) => {
        const before = get()
        const removed = before.items.filter((item) => ids.includes(item.id))
        if (!removed.length) return
        set({
          items: before.items.filter((item) => !ids.includes(item.id)),
          layouts: Object.fromEntries(
            Object.entries(before.layouts).map(([columns, layout]) => [
              columns,
              Object.fromEntries(
                Object.entries(layout).filter(([id]) => !ids.includes(id))
              ),
            ])
          ),
        })
        toast(
          removed.length === 1
            ? `已删除${getComponentDefinition(removed[0].kind).label}「${removed[0].name}」`
            : `已删除 ${removed.length} 个组件`,
          "warning",
          {
            label: "撤销",
            run: () => {
              set((state) => {
                const items = [...state.items]
                const layouts = { ...state.layouts }
                for (const item of removed) {
                  if (items.some((entry) => entry.id === item.id)) continue
                  items.splice(
                    Math.min(
                      before.items.findIndex((entry) => entry.id === item.id),
                      items.length
                    ),
                    0,
                    item
                  )
                  for (const [columns, layout] of Object.entries(
                    before.layouts
                  )) {
                    if (layout[item.id])
                      layouts[Number(columns)] = {
                        ...layouts[Number(columns)],
                        [item.id]: layout[item.id],
                      }
                  }
                }
                return { items, layouts }
              })
              toast(`已恢复 ${removed.length} 个组件`, "success")
            },
          }
        )
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
            `已将标签移入「${folder && folder.kind === "folder" ? folder.name : "文件夹"}」`,
            "success"
          )
        } else toast(`已创建文件夹「${(name ?? "").trim()}」`, "success")
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
        const address = normalizeTabUrl(url)
        if (!name.trim() || !address) throw new Error("请输入名称和有效网址")
        const state = get()
        const match = findBookmarkByUrl(state.items, address)
        if (match?.folderId)
          state.updateFolderTab(match.folderId, match.entry.id, {
            name: name.trim(),
            url: address,
          })
        else if (match) {
          const item = state.items.find((item) => item.id === match.entry.id)
          if (item?.kind === "tab")
            state.saveItem({ ...item, name: name.trim(), url: address })
        } else
          state.saveItem(
            createTabItem({
              name: name.trim(),
              url: address,
            })
          )
      },
      saveItem: (item) =>
        set((state) => ({
          items: state.items.some((existing) => existing.id === item.id)
            ? state.items.map((existing) =>
                existing.id === item.id ? item : existing
              )
            : [...state.items, item],
        })),
      updateFolderTab: (folderId, tabId, changes) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === folderId && item.kind === "folder"
              ? {
                  ...item,
                  tabs: item.tabs.map((tab) =>
                    tab.id === tabId ? { ...tab, ...changes } : tab
                  ),
                }
              : item
          ),
        })),
      addFolderTab: (folderId, tab) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === folderId && item.kind === "folder"
              ? { ...item, tabs: [...item.tabs, tab] }
              : item
          ),
        })),
    }),
    {
      ...storageOptions(),
      name: "omt.tab-grid",
      // lastLayoutColumns stays tab-local: persisting it makes tabs with
      // different column counts overwrite each other in a ping-pong loop.
      partialize: ({ items, layouts, mockDataVersion }) => ({
        items,
        layouts,
        mockDataVersion,
      }),
      merge: (persisted, current) => {
        const items = (persisted as { items?: unknown } | null)?.items
        if (
          items !== undefined &&
          (!Array.isArray(items) || !items.every(validGridItem))
        ) {
          throw new Error("组件数据无效，已停止加载以保留原始数据")
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
            Object.entries(layout).filter(
              ([id, value]) =>
                value &&
                Number.isInteger(value.x) &&
                Number.isInteger(value.y) &&
                value.x >= 0 &&
                value.x <=
                  columns -
                    (storedItems.find((item) => item.id === id)
                      ? itemWidth(
                          storedItems.find((item) => item.id === id)!,
                          columns
                        )
                      : 4) &&
                value.y >= 0 &&
                value.y <= 500
            )
          )
        }
        const savedMockVersion =
          (persisted as { mockDataVersion?: number } | null)?.mockDataVersion ??
          0
        const restoredItems = Array.isArray(items) ? storedItems : initialItems
        return {
          ...current,
          layouts,
          mockDataVersion: import.meta.env.DEV
            ? MOCK_DATA_VERSION
            : savedMockVersion,
          items: restoredItems,
        }
      },
    }
  )
)
