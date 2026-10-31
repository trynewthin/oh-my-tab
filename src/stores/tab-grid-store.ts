import { storageOptions } from "@/lib/storage"
import { groupComponents, resolveGroupAction } from "@/lib/grid/grid-operations"
import { mergeBookmarks, type ImportedBookmark } from "@/lib/bookmark-import"
import { ensureLayoutColumns } from "@/lib/grid/grid-layout"
import { toast } from "@/stores/toast-store"
import { create } from "zustand"
import { persist } from "zustand/middleware"
import { type GridItem, type TabEntry, type TodoTask } from "@/lib/grid/types"
import { sanitizePersisted } from "@/lib/grid/persisted"
import { createFolderItem, createTabItem } from "@/lib/grid/factory"
import {
  addFolderTab,
  describeRemoval,
  randomizeItemColor,
  removeFolderTab,
  removeItems,
  resizeItem,
  restoreItems,
  setItemDynamicEffect,
  setAllTabDynamicEffects,
  updateFolderTab,
  updateTodoTasks,
  upsertBookmark,
  upsertItem,
} from "@/lib/grid/operations"

import { MOCK_DATA_VERSION } from "@/lib/grid/mock-version"
import { mockGridItems } from "@/lib/grid/mock-data"

// Function form keeps the mock list tree-shakeable; a DEV-gated top-level
// constant would survive dead-code elimination through `merge` below.
const devInitialItems = (): GridItem[] =>
  import.meta.env.DEV ? mockGridItems((key) => i18n.t(key)) : []

import type { GridPositions } from "@/lib/grid/grid-layout"

import { transferTab, type TabTransfer } from "@/lib/grid/tab-transfer"
import {
  transferIntoButtonSlot,
  removeButtonSlotControl,
  type SlotRemoval,
  type SlotTransfer,
} from "@/lib/grid/button-slot"

import { randomComponentColor } from "@/lib/component-colors"
import { i18n } from "@/i18n"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

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
  transferIntoSlot: (move: SlotTransfer) => boolean
  removeSlotControl: (removal: SlotRemoval) => boolean
  items: GridItem[]

  setItemDynamicEffect: (id: string, enabled: boolean) => void
  setAllTabDynamicEffects: (enabled: boolean) => void
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
    changes: Pick<TabEntry, "name" | "url"> & { icon?: string }
  ) => void
  addFolderTab: (folderId: string, tab: TabEntry) => void
  removeFolderTab: (folderId: string, tabId: string) => void
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
      transferIntoSlot: (move) => {
        const next = transferIntoButtonSlot(get(), move)
        if (!next) return false
        set(next)
        return true
      },
      removeSlotControl: (removal) => {
        const next = removeButtonSlotControl(get(), removal)
        if (!next) return false
        set(next)
        return true
      },
      setItemDynamicEffect: (id, enabled) =>
        set((state) => ({
          items: setItemDynamicEffect(state.items, id, enabled),
        })),
      setAllTabDynamicEffects: (enabled) =>
        set((state) => ({
          items: setAllTabDynamicEffects(state.items, enabled),
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
        const dynamicEffect =
          useHomeSettingsStore.getState().newTabsDynamicEffect
        const result = mergeBookmarks(get().items, bookmarks, {
          createTab: (input) => createTabItem({ ...input, dynamicEffect }),
          createFolder: (input) =>
            createFolderItem({ ...input, dynamicEffect }),
        })
        if (result.added) set({ items: result.items })
        return { added: result.added, duplicates: result.duplicates }
      },
      upsertBookmark: (name, url) => {
        const { items, result } = upsertBookmark(
          get().items,
          name,
          url,
          useHomeSettingsStore.getState().newTabsDynamicEffect
        )
        if (result.kind === "invalid")
          throw new Error(i18n.t("grid.notify.invalidBookmark"))
        set({ items })
      },
      saveItem: (item) =>
        set((state) => {
          const isNew = !state.items.some((existing) => existing.id === item.id)
          const next =
            isNew &&
            item.kind === "tab" &&
            useHomeSettingsStore.getState().newTabsDynamicEffect
              ? { ...item, dynamicEffect: true }
              : item
          return { items: upsertItem(state.items, next) }
        }),
      updateFolderTab: (folderId, tabId, changes) =>
        set((state) => ({
          items: updateFolderTab(state.items, folderId, tabId, changes),
        })),
      addFolderTab: (folderId, tab) =>
        set((state) => {
          const dynamicEffect =
            useHomeSettingsStore.getState().newTabsDynamicEffect
          const items = addFolderTab(state.items, folderId, tab)
          return {
            items: dynamicEffect
              ? setItemDynamicEffect(items, folderId, true)
              : items,
          }
        }),
      removeFolderTab: (folderId, tabId) =>
        set((state) => ({
          items: removeFolderTab(state.items, folderId, tabId),
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
        if (persisted == null) return current
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
