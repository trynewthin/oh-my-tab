import type { GridPlacement } from "@/lib/grid/grid-layout"
import type { GridItem } from "@/lib/grid/types"
import { getComponentDefinition } from "@/lib/grid/registry"
import GridTileContent from "./grid-tile-content"
import { ItemGlow } from "./grid-dnd-overlay"

// Selection mode renders every tile inert and overlays a checkbox button, so
// the whole tile surface toggles selection instead of opening the item.
export default function GridSelectionItem({
  item,
  placement,
  selected,
  onToggle,
  selectAriaLabel,
}: {
  item: GridItem
  placement: GridPlacement
  selected: boolean
  onToggle: () => void
  selectAriaLabel: string
}) {
  return (
    <div
      data-grid-item-id={item.id}
      className={`relative isolate min-w-0 rounded-2xl ${getComponentDefinition(item.kind).tileBorder ? "border border-tile-border" : ""}`}
      style={{
        gridColumn: `${placement.x + 1} / span ${placement.width}`,
        gridRow: `${placement.y + 1} / span ${placement.height}`,
      }}
    >
      {selected && <ItemGlow color={item.color} />}
      <div
        inert
        className="pointer-events-none relative z-10 h-full overflow-hidden rounded-[inherit]"
      >
        <GridTileContent
          item={{ ...item, dynamicEffect: selected }}
          onOpen={() => {}}
          preview
        />
      </div>
      <button
        type="button"
        role="checkbox"
        aria-checked={selected}
        aria-label={selectAriaLabel}
        className="absolute inset-0 z-30 cursor-pointer appearance-none rounded-[inherit] border-0 bg-transparent p-0 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={onToggle}
      />
    </div>
  )
}
