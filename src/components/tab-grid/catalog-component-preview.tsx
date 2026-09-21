import { useLayoutEffect, useRef, useState } from "react"
import {
  getComponentDefinition,
  getComponentSize,
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import { GRID_CELL_SIZE, GRID_GAP } from "@/lib/grid/grid-layout"
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
  const columns = dimensions.width
  const width = columns * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP
  const height = dimensions.height * (GRID_CELL_SIZE + GRID_GAP) - GRID_GAP
  const scale = Math.min(1, available.width / width, available.height / height)

  useLayoutEffect(() => {
    const node = stage.current
    if (!node) return
    const observer = new ResizeObserver(([entry]) => {
      setAvailable({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <div
      ref={stage}
      data-catalog-preview-stage
      className={`flex w-full items-center justify-center overflow-hidden bg-muted/40 dark:bg-zinc-950/60 ${fill ? `h-full bg-zinc-100 dark:bg-zinc-950 ${detail ? "px-5 pt-8 pb-44 sm:px-8 sm:pt-10" : "p-5"}` : `rounded-2xl p-5 dark:ring-1 dark:ring-white/5 dark:ring-inset ${detail ? "h-64 sm:h-72" : "h-44"}`}`}
    >
      <div
        className="relative shrink-0"
        style={{ width: width * scale, height: height * scale }}
      >
        <div
          data-catalog-preview-content
          inert
          className={`absolute top-0 left-0 isolate origin-top-left overflow-hidden rounded-2xl ${definition.tileBorder ? "border" : ""}`}
          style={{ width, height, transform: `scale(${scale})` }}
        >
          <WidgetCatalogPreview kind={kind} size={resolved} />
        </div>
      </div>
    </div>
  )
}
