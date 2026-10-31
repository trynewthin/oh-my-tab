import { systemActionStatus, type SystemActionId } from "@/lib/system-actions"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useTabGridStore } from "@/stores/tab-grid-store"

export function useSystemActionState(action: SystemActionId) {
  const canTidy = useTabGridStore(
    (state) =>
      action !== "tidy-grid" ||
      (!!state.lastLayoutColumns && state.items.length > 0)
  )
  const selecting = useGridSelectionStore(
    (state) => action === "toggle-selection" && state.active
  )
  return systemActionStatus(action, { canTidy, selecting })
}
