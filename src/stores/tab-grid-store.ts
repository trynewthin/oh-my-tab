import { create } from "zustand"
import { persist } from "zustand/middleware"
import {
  normalizeTabUrl,
  type GridItem,
  type TabEntry,
} from "@/components/tab-grid/types"

import {
  mockGridItems,
  additionalMockGridItems,
  MOCK_DATA_VERSION,
} from "@/components/tab-grid/mock-data"

const initialItems = import.meta.env.DEV ? mockGridItems : []

import type { GridPositions } from "@/components/tab-grid/grid-layout"

import {
  transferTab,
  type TabTransfer,
} from "@/components/tab-grid/tab-transfer"

import { randomFolderColor } from "@/lib/folder-colors"

type TabGridState = {
  mockDataVersion: number
  layouts: Record<number, GridPositions>
  setLayout: (columns: number, positions: GridPositions) => void
  transferTab: (move: TabTransfer) => void
  items: GridItem[]

  setItemDynamicEffect: (id: string, enabled: boolean) => void
  randomizeItemColor: (id: string) => void
  resizeItem: (id: string, size: GridItem["size"]) => void
  removeItem: (id: string) => void
  saveItem: (item: GridItem) => void
  updateFolderTab: (
    folderId: string,
    tabId: string,
    changes: Pick<TabEntry, "name" | "url">
  ) => void
  addFolderTab: (folderId: string, tab: TabEntry) => void
}

function validEntry(value: unknown): value is TabEntry {
  if (!value || typeof value !== "object") return false
  const entry = value as TabEntry
  return (
    (entry.dynamicEffect === undefined ||
      typeof entry.dynamicEffect === "boolean") &&
    typeof entry.id === "string" &&
    typeof entry.name === "string" &&
    (entry.size === undefined || ["small", "medium"].includes(entry.size)) &&
    (entry.color === undefined || /^#[0-9a-f]{6}$/i.test(entry.color)) &&
    typeof entry.url === "string" &&
    /^https?:\/\//i.test(entry.url) &&
    normalizeTabUrl(entry.url) !== null
  )
}
export function validItem(value: unknown): value is GridItem {
  if (!value || typeof value !== "object") return false
  const item = value as GridItem
  if (
    typeof item.id !== "string" ||
    typeof item.name !== "string" ||
    !/^#[0-9a-f]{6}$/i.test(item.color)
  )
    return false
  return item.kind === "tab"
    ? validEntry(item) && ["small", "medium"].includes(item.size)
    : item.kind === "folder" &&
        ["small", "large", "tall"].includes(item.size) &&
        (item.dynamicEffect === undefined ||
          typeof item.dynamicEffect === "boolean") &&
        Array.isArray(item.tabs) &&
        item.tabs.every(validEntry)
}

export const useTabGridStore = create<TabGridState>()(
  persist(
    (set) => ({
      mockDataVersion: import.meta.env.DEV ? MOCK_DATA_VERSION : 0,
      layouts: {},
      setLayout: (columns, positions) =>
        set((state) => ({
          layouts: { ...state.layouts, [columns]: positions },
        })),
      items: initialItems,
      transferTab: (move) => set((state) => transferTab(state, move)),
      setItemDynamicEffect: (id, enabled) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, dynamicEffect: enabled } : item
          ),
        })),
      randomizeItemColor: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id
              ? { ...item, color: randomFolderColor(item.color) }
              : item
          ),
        })),
      resizeItem: (id, size) =>
        set((state) => ({
          items: state.items.map((item) => {
            if (item.id !== id) return item
            if (item.kind === "tab" && (size === "small" || size === "medium"))
              return { ...item, size }
            if (
              item.kind === "folder" &&
              (size === "small" || size === "large" || size === "tall")
            )
              return { ...item, size }
            return item
          }),
        })),
      removeItem: (id) =>
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          layouts: Object.fromEntries(
            Object.entries(state.layouts).map(([columns, layout]) => [
              columns,
              Object.fromEntries(
                Object.entries(layout).filter(([itemId]) => itemId !== id)
              ),
            ])
          ),
        })),
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
      name: "omt.tab-grid",
      partialize: ({ items, layouts, mockDataVersion }) => ({
        items,
        layouts,
        mockDataVersion,
      }),
      merge: (persisted, current) => {
        const items = (persisted as { items?: unknown } | null)?.items
        const storedItems = Array.isArray(items) ? items.filter(validItem) : []
        const savedLayouts = (
          persisted as { layouts?: Record<string, unknown> } | null
        )?.layouts
        const layouts: Record<number, GridPositions> = {}
        for (const columns of [4, 8, 12]) {
          const layout = savedLayouts?.[columns]
          if (!layout || typeof layout !== "object") continue
          layouts[columns] = Object.fromEntries(
            Object.entries(layout).filter(
              ([, value]) =>
                value &&
                Number.isInteger(value.x) &&
                Number.isInteger(value.y) &&
                value.x >= 0 &&
                value.x <= columns - 4 &&
                value.y >= 0 &&
                value.y <= 500
            )
          )
        }
        const savedMockVersion =
          (persisted as { mockDataVersion?: number } | null)?.mockDataVersion ??
          0
        let restoredItems = Array.isArray(items) ? storedItems : initialItems
        if (import.meta.env.DEV && savedMockVersion < MOCK_DATA_VERSION) {
          const existingIds = new Set(
            restoredItems.flatMap((item) =>
              item.kind === "folder"
                ? [item.id, ...item.tabs.map((tab) => tab.id)]
                : [item.id]
            )
          )
          const additions = additionalMockGridItems
            .filter((item) => !existingIds.has(item.id))
            .map((item) =>
              item.kind === "folder"
                ? {
                    ...item,
                    tabs: item.tabs.filter((tab) => !existingIds.has(tab.id)),
                  }
                : item
            )
          restoredItems = [...restoredItems, ...additions]
        }
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
