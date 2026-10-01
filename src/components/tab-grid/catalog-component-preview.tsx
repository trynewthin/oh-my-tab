import { useLayoutEffect, useRef, useState } from "react"
import {
  getComponentDefinition,
  getComponentSize,
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import { GRID_CELL_SIZE, GRID_GAP } from "@/lib/grid/grid-layout"
import { fitPreview } from "@/lib/preview-fit"
import HomeSurface from "@/components/home/home-surface"
import { WidgetCatalogPreview } from "./widget-ui"

export default function CatalogComponentPreview({
  kind,
  size,
  detail = false,
  fill = false,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
  detail?: boolean
  fill?: boolean
}) {
  const stage = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState({ width: 0, height: 0 })
  const definition = getComponentDefinition(kind)
  const resolved = size ?? definition.defaultSize
  const dimensions = getComponentSize(kind, resolved)!
  const width = dimensions.width * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP
  const height = dimensions.height * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP
  const fitted = fitPreview({ width, height }, available)

  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      const next = {
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      }
      setAvailable((current) =>
        current.width === next.width && current.height === next.height
          ? current
          : next
      )
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <HomeSurface
      className={`flex w-full items-center justify-center overflow-hidden ${fill ? `h-full ${detail ? "p-8" : "p-5"}` : `rounded-2xl p-5 ${detail ? "h-64 sm:h-72" : "h-44"}`}`}
    >
      <div
        ref={stage}
        data-catalog-preview-stage
        className="flex size-full items-center justify-center"
      >
        <div
          className="relative shrink-0"
          style={{ width: fitted.width, height: fitted.height }}
        >
          <div
            data-catalog-preview-content
            inert
            className={`absolute top-0 left-0 isolate origin-top-left overflow-hidden rounded-2xl ${definition.tileBorder ? "border" : ""}`}
            style={{ width, height, transform: `scale(${fitted.scale})` }}
          >
            <WidgetCatalogPreview kind={kind} size={resolved} />
          </div>
        </div>
      </div>
    </HomeSurface>
  )
}
