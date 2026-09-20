import { i18n } from "@/i18n"
import { placeItems, positionsOnly } from "@/lib/grid/grid-layout"
import type { ButtonAction } from "@/lib/grid/types"
import { useComponentsApplicationStore } from "@/stores/components-application-store"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { useThemeStore } from "@/stores/theme-store"
import { toast } from "@/stores/toast-store"

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

export function runSystemAction(action: ButtonAction) {
  switch (action) {
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
      useSettingsStore.getState().setOpen(true)
      return
    case "open-components":
      useComponentsApplicationStore.getState().setOpen(true)
  }
}
