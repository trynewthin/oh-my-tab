import { i18n } from "@/i18n"
import { placeItems, positionsOnly } from "@/lib/grid/grid-layout"
import type { SettingsSection } from "@/lib/settings-sections"
import type { SystemActionId } from "@/lib/system-actions"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useThemeStore, type Theme } from "@/stores/theme-store"
import { toast } from "@/stores/toast-store"

export type SystemActionRequest =
  | SystemActionId
  | { id: "set-theme"; theme: Theme }
  | { id: "open-settings"; section: SettingsSection }

function assertNever(action: never): never {
  throw new Error(`Unhandled system action: ${String(action)}`)
}

function tidyGrid() {
  const state = useTabGridStore.getState()
  const columns = state.lastLayoutColumns
  if (!columns || !state.items.length) return
  const previous = state.layouts[columns] ?? {}
  const ordered = [...state.items].sort((leftItem, rightItem) => {
    const left = previous[leftItem.id] ?? { x: 0, y: 0 }
    const right = previous[rightItem.id] ?? { x: 0, y: 0 }
    return left.y - right.y || left.x - right.x
  })
  state.setLayout(columns, positionsOnly(placeItems(ordered, columns, {})))
  toast(i18n.t("shell.moreActions.tidyDone"), "success", {
    label: i18n.t("shell.moreActions.undo"),
    run: () => useTabGridStore.getState().setLayout(columns, previous),
  })
}

export function runSystemAction(request: SystemActionRequest) {
  if (typeof request !== "string") {
    if (request.id === "set-theme")
      useThemeStore.getState().setTheme(request.theme)
    else useSystemOverlayStore.getState().openSettings(request.section)
    return
  }

  switch (request) {
    case "toggle-theme": {
      const { theme, setTheme } = useThemeStore.getState()
      const dark =
        typeof document === "undefined"
          ? theme === "dark"
          : document.documentElement.classList.contains("dark")
      setTheme(dark ? "light" : "dark")
      return
    }
    case "tidy-grid":
      tidyGrid()
      return
    case "toggle-selection":
      useGridSelectionStore.getState().toggleMode()
      return
    case "open-settings":
      useSystemOverlayStore.getState().openSettings()
      return
    case "open-components":
      useSystemOverlayStore.getState().open("components")
      return
    case "add-tab":
      useSystemOverlayStore.getState().open("add-tab")
      return
    case "add-folder":
      useSystemOverlayStore.getState().open("add-folder")
      return
  }
  return assertNever(request)
}
