import type { CatalogComponentKind, GridItemSize } from "@/lib/grid/registry"
import { WidgetCatalogPreview } from "./widget-ui"

export default function CatalogComponentPreview({
  kind,
  size,
  detail,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
  detail?: boolean
}) {
  if (detail)
    return <WidgetCatalogPreview kind={kind} size={size} detail={detail} />
  return (
    <div className="[container-type:inline-size] mx-auto aspect-square w-full max-w-48">
      <div className="size-60 origin-top-left [transform:scale(calc(100cqw/240px))]">
        <WidgetCatalogPreview kind={kind} size={size} />
      </div>
    </div>
  )
}
