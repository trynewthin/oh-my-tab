import type { GridItem } from "@/lib/grid/types"
import { ItemGlow } from "./grid-dnd-overlay"

export default function GridSelectionItem({
  item,
  selected,
  onToggle,
  selectAriaLabel,
}: {
  item: GridItem
  selected: boolean
  onToggle: () => void
  selectAriaLabel: string
}) {
  return (
    <>
      {selected && <ItemGlow color={item.color} />}
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        // The draggable wrapper is aria-disabled while selecting; re-enable this control.
        aria-disabled={false}
        aria-label={selectAriaLabel}
        className="absolute inset-0 z-30 cursor-pointer appearance-none rounded-[inherit] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onToggle}
      />
    </>
  )
}
