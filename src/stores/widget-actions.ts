import {
  isUtilityWidget,
  type UtilityWidgetItem,
} from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import { useTabGridStore } from "./tab-grid-store"

/** Read current state at mutation time; never resurrect a removed widget. */
export function updateUtilityWidget(
  id: string,
  change: (item: UtilityWidgetItem) => UtilityWidgetItem
) {
  const current = useTabGridStore.getState().items.find((item) => item.id === id)
  if (!current || !isUtilityWidget(current)) return
  const next = change(current)
  if (next === current) return
  if (
    next.id !== current.id ||
    next.kind !== current.kind ||
    !validGridItem(next)
  )
    throw new Error("Invalid widget update")
  useTabGridStore.getState().saveItem(next)
}
