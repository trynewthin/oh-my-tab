import { useCallback, useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { blankDots } from "@/lib/grid/dot-canvas-data"
import { useTranslation } from "react-i18next"

export default function DotImageCrop({
  image,
  columns,
  rows,
  onClose,
  onConfirm,
}: {
  image: ImageBitmap
  columns: number
  rows: number
  onClose: () => void
  onConfirm: (pixels: string[]) => void
}) {
  const [zoom, setZoom] = useState(1)
  const { t } = useTranslation()
  const [center, setCenter] = useState({
    x: image.width / 2,
    y: image.height / 2,
  })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const ratio = columns / rows
  const width = Math.min(image.width, image.height * ratio) / zoom
  const height = width / ratio
  const x = Math.max(0, Math.min(image.width - width, center.x - width / 2))
  const y = Math.max(0, Math.min(image.height - height, center.y - height / 2))
  const paintPreview = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const context = canvas.getContext("2d")!
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(
        image,
        x,
        y,
        width,
        height,
        0,
        0,
        canvas.width,
        canvas.height
      )
    },
    [image, x, y, width, height]
  )
  function confirm() {
    const canvas = document.createElement("canvas")
    canvas.width = columns
    canvas.height = rows
    const context = canvas.getContext("2d")!
    context.drawImage(image, x, y, width, height, 0, 0, columns, rows)
    const data = context.getImageData(0, 0, columns, rows).data
    onConfirm(
      blankDots(columns, rows).map((_, i) =>
        data[i * 4 + 3] < 128
          ? ""
          : `#${Array.from(data.slice(i * 4, i * 4 + 3))
              .map((v) => v.toString(16).padStart(2, "0"))
              .join("")}`
      )
    )
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{t("grid.dotCanvas.cropTitle")}</DialogTitle>
        </DialogHeader>
        <canvas
          ref={paintPreview}
          width={480}
          height={480 / ratio}
          role="img"
          aria-label={t("grid.dotCanvas.cropAria")}
          className="w-full cursor-move touch-none rounded-2xl border bg-muted"
          style={{ aspectRatio: ratio }}
          onPointerDown={(event) => {
            if (event.button !== 0) return
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerMove={(event) => {
            if (!drag.current) return
            const bounds = event.currentTarget.getBoundingClientRect()
            const nextX =
              x +
              width / 2 -
              ((event.clientX - drag.current.x) * width) / bounds.width
            const nextY =
              y +
              height / 2 -
              ((event.clientY - drag.current.y) * height) / bounds.height
            setCenter({
              x: Math.max(width / 2, Math.min(image.width - width / 2, nextX)),
              y: Math.max(
                height / 2,
                Math.min(image.height - height / 2, nextY)
              ),
            })
            drag.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerUp={() => {
            drag.current = null
          }}
          onPointerCancel={() => {
            drag.current = null
          }}
        />
        <label className="flex items-center justify-between gap-4">
          {t("grid.dotCanvas.zoom")}
          <input
            aria-label={t("grid.dotCanvas.zoomAria")}
            className="w-2/3"
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            onChange={(event) => {
              setCenter({ x: x + width / 2, y: y + height / 2 })
              setZoom(Number(event.target.value))
            }}
          />
        </label>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t("grid.dotCanvas.cancel")}
          </Button>
          <Button onClick={confirm}>{t("grid.dotCanvas.confirmCrop")}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
