import type { GridPlacement } from "@/lib/grid/grid-layout"
import type { GridItem } from "@/lib/grid/types"
import { getComponentDefinition } from "@/lib/grid/registry"
import GridTileContent from "./grid-tile-content"
import { ItemGlow } from "./grid-dnd-overlay"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

// Tiles render inert; an overlaid checkbox makes the whole surface toggle
// selection instead of opening the item.
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
  const folderRadius = useHomeSettingsStore((state) =>
    item.kind === "folder" ? state.folderRadius : undefined
  )
  return (
    <div
      data-grid-item-id={item.id}
      className={`relative isolate min-w-0 rounded-2xl ${getComponentDefinition(item.kind).tileBorder ? (item.kind === "folder" ? "border border-transparent" : "border border-tile-border") : ""}`}
      style={{
        borderRadius: folderRadius,
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
