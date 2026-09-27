import SearchPrompt from "@/components/search/search-prompt"
import { runHomeSearch } from "@/application/home-search"
import type { GridItem } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

export default function SearchTile({
  preview = false,
}: {
  item: Extract<GridItem, { kind: "search-minimal" }>
  preview?: boolean
}) {
  const { t } = useTranslation()
  return (
    <div
      className="relative flex h-full w-full items-center py-0.5"
      inert={preview ? true : undefined}
    >
      <div className="h-full w-full">
        <SearchPrompt
          embedded
          style="minimal"
          onSubmit={(query) => runHomeSearch(query, t)}
        />
      </div>
    </div>
  )
}
