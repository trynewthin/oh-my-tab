import { GRID_CELL_SIZE } from "@/lib/grid/grid-layout"
import SearchPrompt from "@/components/search/search-prompt"
import { runHomeSearch } from "@/application/home-search"
import type { GridItem } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

export default function SearchTile({
  item,
  preview = false,
}: {
  item: Extract<GridItem, { kind: "search-minimal" | "search-full" }>
  preview?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      className="relative flex h-full w-full items-center py-0.5"
      inert={preview ? true : undefined}
    >
      <div
        className="h-full w-full"
        style={
          item.kind === "search-full"
            ? { maxHeight: GRID_CELL_SIZE - 4 }
            : undefined
        }
      >
        <SearchPrompt
          embedded
          style="minimal"
          onSubmit={(query) => runHomeSearch(query, t)}
        />
      </div>
    </div>
  )
}
