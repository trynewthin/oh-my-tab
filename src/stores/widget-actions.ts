import {
  isUtilityWidget,
  type UtilityWidgetItem,
} from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import { useTabGridStore } from "./tab-grid-store"
import type { ButtonSlotControl, GridItem } from "@/lib/grid/types"
import { appendButtonSlotControl } from "@/lib/grid/button-slot"

export function addButtonSlotControl(id: string, control: ButtonSlotControl) {
  let added = false
  updateGridItem(id, (current) => {
    if (current.kind !== "button-slot") return current
    const next = appendButtonSlotControl(current, control)
    if (!next) return current
    added = true
    return next
  })
  return added
}

export function updateGridItem(
  id: string,
  change: (item: GridItem) => GridItem
) {
  const store = useTabGridStore.getState()
  const current = store.items.find((item) => item.id === id)
  if (!current) return
  const next = change(current)
  if (next === current) return
  if (
    next.id !== current.id ||
    next.kind !== current.kind ||
    !validGridItem(next)
  )
    throw new Error("Invalid component update")
  store.saveItem(next)
}

/** Read current state at mutation time; never resurrect a removed widget. */
export function updateUtilityWidget(
  id: string,
  change: (item: UtilityWidgetItem) => UtilityWidgetItem
) {
  updateGridItem(id, (current) =>
    isUtilityWidget(current) ? change(current) : current
  )
}
