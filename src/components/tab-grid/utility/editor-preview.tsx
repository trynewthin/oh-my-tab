import { useLayoutEffect, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { gridOccupancyBox } from "@/lib/grid/grid-layout"
import { getComponentSize, occupancyMark } from "@/lib/grid/registry"
import type { UtilityWidgetItem } from "@/lib/grid/utility-types"
import UtilityWidgetTile from "../utility-widget-tile"

export default function WidgetEditorPreview({
  item,
}: {
  item: UtilityWidgetItem
}) {
  const { t } = useTranslation()
  const stage = useRef<HTMLDivElement>(null)
  const [available, setAvailable] = useState({ width: 0, height: 0 })
  const dimensions = getComponentSize(item.kind, item.size)!
  const box = gridOccupancyBox(0, dimensions.width, dimensions.height)
  const scale = Math.max(
    0,
    Math.min(1, available.width / box.width, available.height / box.height)
  )
  useLayoutEffect(() => {
    if (!stage.current) return
    const observer = new ResizeObserver(([entry]) =>
      setAvailable({
        width: entry.contentRect.width,
        height: entry.contentRect.height,
      })
    )
    observer.observe(stage.current)
    return () => observer.disconnect()
  }, [])
  const remote = item.kind === "weather" || item.kind === "rss"
  return (
    <aside
      className="utility-editor-preview"
      aria-label={t("widgets.design.previewTitle")}
    >
      <div className="utility-editor-preview-label">
        <span>{t("widgets.design.previewTitle")}</span>
        <span>{occupancyMark(dimensions.width, dimensions.height)}</span>
      </div>
      <div ref={stage} className="utility-editor-preview-stage">
        <div
          style={{ width: box.width * scale, height: box.height * scale }}
          className="relative shrink-0"
        >
          <div
            inert
            aria-hidden="true"
            className="absolute top-0 left-0 isolate origin-top-left overflow-hidden rounded-2xl border border-tile-border"
            style={{
              width: box.width,
              height: box.height,
              transform: `scale(${scale})`,
            }}
          >
            <UtilityWidgetTile
              item={item}
              preview
              sample={remote}
              onOpen={() => {}}
            />
          </div>
        </div>
      </div>
      <p className="utility-editor-preview-hint">
        {t(remote ? "widgets.previewOnly" : "widgets.design.previewHint")}
      </p>
    </aside>
  )
}
