import { useCallback, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { squareTabIconCrop, type TabIconCropArea } from "@/lib/grid/tab-icon"

export default function TabIconCrop({
  image,
  busy,
  contentClassName,
  overlayClassName,
  onClose,
  onConfirm,
}: {
  image: ImageBitmap
  busy: boolean
  contentClassName?: string
  overlayClassName?: string
  onClose: () => void
  onConfirm: (crop: TabIconCropArea) => void
}) {
  const { t } = useTranslation()
  const [zoom, setZoom] = useState(1)
  const [center, setCenter] = useState({
    x: image.width / 2,
    y: image.height / 2,
  })
  const drag = useRef<{ x: number; y: number } | null>(null)
  const crop = squareTabIconCrop(image, zoom, center)
  const paintPreview = useCallback(
    (canvas: HTMLCanvasElement | null) => {
      if (!canvas) return
      const context = canvas.getContext("2d")
      if (!context) return
      context.clearRect(0, 0, canvas.width, canvas.height)
      context.drawImage(
        image,
        crop.x,
        crop.y,
        crop.size,
        crop.size,
        0,
        0,
        canvas.width,
        canvas.height
      )
    },
    [crop, image]
  )

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onClose()
      }}
    >
      <DialogContent
        className={`max-h-[90svh] overflow-y-auto sm:max-w-md ${contentClassName ?? ""}`}
        overlayClassName={overlayClassName}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>{t("grid.editor.cropIconTitle")}</DialogTitle>
        </DialogHeader>
        <canvas
          ref={paintPreview}
          width={480}
          height={480}
          role="img"
          aria-label={t("grid.editor.cropIconPreview")}
          className="aspect-square w-full cursor-move touch-none rounded-2xl border bg-muted"
          onPointerDown={(event) => {
            if (event.button !== 0 || busy) return
            event.currentTarget.setPointerCapture(event.pointerId)
            drag.current = { x: event.clientX, y: event.clientY }
          }}
          onPointerMove={(event) => {
            if (!drag.current || busy) return
            const bounds = event.currentTarget.getBoundingClientRect()
            const nextX =
              crop.x +
              crop.size / 2 -
              ((event.clientX - drag.current.x) * crop.size) / bounds.width
            const nextY =
              crop.y +
              crop.size / 2 -
              ((event.clientY - drag.current.y) * crop.size) / bounds.height
            setCenter({
              x: Math.max(
                crop.size / 2,
                Math.min(image.width - crop.size / 2, nextX)
              ),
              y: Math.max(
                crop.size / 2,
                Math.min(image.height - crop.size / 2, nextY)
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
          {t("grid.editor.cropIconZoom")}
          <input
            aria-label={t("grid.editor.cropIconZoom")}
            className="w-2/3"
            type="range"
            min="1"
            max="4"
            step="0.01"
            value={zoom}
            disabled={busy}
            onChange={(event) => {
              setCenter({
                x: crop.x + crop.size / 2,
                y: crop.y + crop.size / 2,
              })
              setZoom(Number(event.target.value))
            }}
          />
        </label>
        <DialogFooter>
          <Button variant="outline" disabled={busy} onClick={onClose}>
            {t("grid.editor.cancel")}
          </Button>
          <Button disabled={busy} onClick={() => onConfirm(crop)}>
            {t(busy ? "grid.editor.processingIcon" : "grid.editor.cropIcon")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
