import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useThemeStore } from "@/stores/theme-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useGardenStore } from "@/stores/garden-store"
import { editStoredEntries } from "@/lib/storage"
import {
  categoryFor,
  storedState,
  type StorageCategory,
} from "@/lib/storage-usage"

export async function clearStorageCategories(categories: StorageCategory[]) {
  const selected = new Set<StorageCategory>(
    categories.filter((id) => id !== "system")
  )
  await editStoredEntries((entries) => {
    const home = storedState(entries["omt.home-settings"])
    const updates: Record<string, unknown> = {}
    const remove: string[] = []
    const save = (key: string, state: unknown) => {
      updates[key] = JSON.stringify({ state, version: 0 })
    }
    for (const [key, value] of Object.entries(entries)) {
      const category = categoryFor(key, home.backgroundImage)
      if (!selected.has(category)) continue
      if (category === "unused-images") {
        const createdAt = (value as { createdAt?: number } | null)?.createdAt
        // A newly uploaded asset may not have been linked to settings yet.
        if (createdAt && createdAt > Date.now() - 86400000) continue
        remove.push(key)
      } else if (category === "icons" || category === "background")
        remove.push(key)
    }
    if (selected.has("preferences") || selected.has("background")) {
      const next = selected.has("preferences")
        ? {
            ...useHomeSettingsStore.getInitialState(),
            backgroundImage: home.backgroundImage ?? null,
            backgroundType: home.backgroundType ?? "solid",
          }
        : { ...home }
      if (selected.has("background")) {
        next.backgroundImage = null
        next.backgroundType = "solid"
      }
      save("omt.home-settings", next)
    }
    if (selected.has("preferences")) {
      save("omt.theme-mode", useThemeStore.getInitialState())
      save("omt.search-engines", useSearchEngineStore.getInitialState())
    }
    if (selected.has("bookmarks"))
      save("omt.tab-grid", {
        ...useTabGridStore.getInitialState(),
        items: [],
        layouts: {},
        lastLayoutColumns: undefined,
      })
    if (selected.has("garden"))
      save("omt.garden", {
        ...useGardenStore.getInitialState(),
        initialized: true,
        pointsUpdatedAt: Date.now(),
      })
    if (selected.has("webdav")) {
      updates["omt.webdav"] = null
      updates["omt.sync-provider"] = "local"
    }
    return { updates, remove }
  })
}
