import { DotsSix } from "@phosphor-icons/react"
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
      className={`relative h-full w-full ${item.kind === "search-minimal" ? "py-0.5" : ""}`}
      inert={preview ? true : undefined}
    >
      {!preview && (
        <span
          aria-hidden="true"
          data-grid-drag-handle
          className="absolute top-1 left-1/2 z-30 flex size-5 -translate-x-1/2 cursor-grab items-center justify-center rounded-full bg-background/80 text-muted-foreground opacity-0 shadow-sm backdrop-blur-sm transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <DotsSix className="size-3.5" />
        </span>
      )}
      <SearchPrompt
        embedded
        style={item.kind === "search-minimal" ? "minimal" : "full"}
        onSubmit={(query) => runHomeSearch(query, t)}
      />
    </div>
  )
}
