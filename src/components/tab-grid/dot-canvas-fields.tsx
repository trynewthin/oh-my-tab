import DotImageCrop from "./dot-image-crop"
import { useEffect, useRef, useState, type PointerEvent } from "react"
import { Button } from "@/components/ui/button"
import { updateGridItem } from "@/stores/widget-actions"
import { toast } from "@/stores/toast-store"
import DotArt from "./dot-art"
import {
  blankDots,
  dotDimensions,
  isDotVisible,
  resizeDots,
} from "@/lib/grid/dot-canvas-data"
import type { DotCanvasItem } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

export default function DotCanvasFields({
  item,
  onDialogOpenChange,
}: {
  item: DotCanvasItem
  onDialogOpenChange: (open: boolean) => void
}) {
  const pixels = item.pixels
  function setPixels(change: string[] | ((pixels: string[]) => string[])) {
    updateGridItem(item.id, (current) =>
      current.kind === "dot-canvas"
        ? {
            ...current,
            pixels:
              typeof change === "function"
                ? change(current.pixels)
                : resizeDots(
                    change,
                    pixelColumns,
                    current.pixelColumns,
                    current.pixels.length / current.pixelColumns
                  ),
          }
        : current
    )
  }
  const pixelColumns = item.pixelColumns
  const { columns, rows } = dotDimensions(pixels, pixelColumns)
  const { t } = useTranslation()
  const [color, setColorState] = useState(item.color)
  function setColor(color: string) {
    setColorState(color)
    updateGridItem(item.id, (current) =>
      current.kind === "dot-canvas" ? { ...current, color } : current
    )
  }
  const [tool, setTool] = useState<"draw" | "erase" | "pick">("draw")
  const [history, setHistory] = useState<
    { pixels: string[]; pixelColumns: number }[]
  >([])
  const [importing, setImporting] = useState(false)
  const [cropImage, setCropImage] = useState<ImageBitmap | null>(null)
  useEffect(() => () => cropImage?.close(), [cropImage])
  useEffect(() => {
    onDialogOpenChange(cropImage !== null)
  }, [cropImage, onDialogOpenChange])
  const fileRef = useRef<HTMLInputElement>(null)
  const stroke = useRef<{ x: number; y: number } | null>(null)
  function remember() {
    setHistory((previous) => [...previous.slice(-29), { pixels, pixelColumns }])
  }
  function paint(event: PointerEvent<SVGSVGElement>, start = false) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = Math.floor(
      ((event.clientX - bounds.left) / bounds.width) * columns
    )
    const y = Math.floor(((event.clientY - bounds.top) / bounds.height) * rows)
    if (start) {
      if (event.button !== 0) return
      if (tool === "pick") {
        if (
          x < 0 ||
          x >= columns ||
          y < 0 ||
          y >= rows ||
          !isDotVisible(y * columns + x, columns, rows)
        )
          return
        const picked = pixels[y * columns + x]
        if (!picked) {
          toast(t("grid.dotCanvas.noColor"), "info")
          return
        }
        setColor(picked)
        setTool("draw")
        return
      }
      remember()
      event.currentTarget.setPointerCapture(event.pointerId)
      stroke.current = { x, y }
    }
    const from = stroke.current
    if (!from) return
    const steps = Math.max(Math.abs(x - from.x), Math.abs(y - from.y), 1)
    setPixels((previous) => {
      const next = [...previous]
      for (let i = 0; i <= steps; i++) {
        const px = Math.round(from.x + ((x - from.x) * i) / steps)
        const py = Math.round(from.y + ((y - from.y) * i) / steps)
        if (
          px >= 0 &&
          px < columns &&
          py >= 0 &&
          py < rows &&
          isDotVisible(py * columns + px, columns, rows)
        )
          next[py * columns + px] = tool === "erase" ? "" : color
      }
      return next
    })
    stroke.current = { x, y }
  }
  async function importImage(file?: File) {
    if (!file) return
    if (!file.type.startsWith("image/") || file.size > 20 * 1024 * 1024) {
      toast(t("grid.dotCanvas.imageTooLarge"), "error")
      return
    }
    setImporting(true)
    try {
      const image = await createImageBitmap(file)
      setCropImage(image)
    } catch {
      toast(t("grid.dotCanvas.imageReadError"), "error")
    } finally {
      setImporting(false)
    }
  }
  return (
    <>
      <div className="space-y-3">
        <div
          className="w-full overflow-hidden rounded-xl border border-border bg-muted"
          style={{ aspectRatio: `${columns} / ${rows}` }}
        >
          <DotArt
            pixels={pixels}
            pixelColumns={pixelColumns}
            onPointerDown={(event) => {
              if (!importing) paint(event, true)
            }}
            onPointerMove={(event) => paint(event)}
            onPointerUp={() => {
              stroke.current = null
            }}
          />
        </div>
        <div
          role="toolbar"
          aria-label={t("grid.dotCanvas.toolbar")}
          className="flex flex-wrap gap-2"
        >
          <input
            aria-label={t("grid.dotCanvas.brushColor")}
            type="color"
            value={color}
            onChange={(event) => {
              setColor(event.target.value)
              setTool("draw")
            }}
            className="h-8 w-12 rounded border"
          />
          <Button
            type="button"
            variant={tool === "draw" ? "secondary" : "outline"}
            aria-pressed={tool === "draw"}
            onClick={() => setTool("draw")}
          >
            {t("grid.dotCanvas.brush")}
          </Button>
          <Button
            type="button"
            variant={tool === "erase" ? "secondary" : "outline"}
            aria-pressed={tool === "erase"}
            onClick={() => setTool("erase")}
          >
            {t("grid.dotCanvas.eraser")}
          </Button>
          <Button
            type="button"
            variant={tool === "pick" ? "secondary" : "outline"}
            aria-pressed={tool === "pick"}
            onClick={() => setTool("pick")}
          >
            {t("grid.dotCanvas.picker")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={!history.length || importing}
            onClick={() => {
              const previous = history[history.length - 1]
              setPixels(
                resizeDots(
                  previous.pixels,
                  previous.pixelColumns,
                  columns,
                  rows
                )
              )
              setHistory(history.slice(0, -1))
            }}
          >
            {t("grid.dotCanvas.undo")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => {
              remember()
              setPixels(blankDots(columns, rows))
            }}
          >
            {t("grid.dotCanvas.clear")}
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={importing}
            onClick={() => fileRef.current?.click()}
          >
            {importing
              ? t("grid.dotCanvas.convertPending")
              : t("grid.dotCanvas.importImage")}
          </Button>
          <input
            ref={fileRef}
            aria-label={t("grid.dotCanvas.importImageLabel")}
            className="hidden"
            type="file"
            accept="image/*"
            onChange={(event) => {
              void importImage(event.target.files?.[0])
              event.target.value = ""
            }}
          />
        </div>
      </div>
      {cropImage && (
        <DotImageCrop
          image={cropImage}
          columns={columns}
          rows={rows}
          onClose={() => setCropImage(null)}
          onConfirm={(next) => {
            remember()
            setPixels(next)
            setCropImage(null)
          }}
        />
      )}
    </>
  )
}
