import { useLayoutEffect, useRef, useState } from "react"
import TabGrid from "@/components/tab-grid/tab-grid"
import {
  gridOccupancyBox,
  type GridPositions,
} from "@/lib/grid/grid-layout"
import type { GridItem } from "@/lib/grid/types"

const MAX_PREVIEW_WIDTH = 448

export default function ScaledGridPreview({
  items,
  trackWidth,
  area,
  positions,
}: {
  items: GridItem[]
  trackWidth: number
  area: { columns: number; rows: number }
  positions: GridPositions
}) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const box = gridOccupancyBox(trackWidth, area.columns, area.rows)

  useLayoutEffect(() => {
    const container = containerRef.current
    if (!container) return
    const update = () => {
      const availableWidth = Math.min(
        container.clientWidth,
        MAX_PREVIEW_WIDTH
      )
      setScale(Math.min(1, availableWidth / box.width))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [box.width])

  return (
    <div ref={containerRef} className="w-full">
      {scale > 0 && (
        <div
          data-scaled-grid-preview
          className="relative mx-auto"
          style={{
            width: box.width * scale,
            height: box.height * scale,
          }}
        >
          <div
            className="absolute top-0 left-0"
            style={{
              width: box.width,
              height: box.height,
              transform: `scale(${scale})`,
              transformOrigin: "top left",
            }}
          >
            <TabGrid
              preview
              previewScale={scale}
              items={items}
              trackWidth={trackWidth}
              area={area}
              previewPositions={positions}
            />
          </div>
        </div>
      )}
    </div>
  )
}
