import DotImageCrop from "./dot-image-crop"
import { useEffect, useRef, useState, type PointerEvent } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { toast } from "@/stores/toast-store"
import DotArt from "./dot-art"
import {
  blankDots,
  dotDimensions,
  displayDots,
  isDotVisible,
} from "./dot-canvas-data"
import type { DotCanvasItem } from "./types"

export default function DotCanvasConfiguration({
  item,
  onClose,
  onSaved,
}: {
  item?: DotCanvasItem
  onClose: () => void
  onSaved: () => void
}) {
  const [pixels, setPixels] = useState(() =>
    item ? displayDots(item.pixels) : blankDots()
  )
  const { columns, rows } = dotDimensions(pixels)
  const [color, setColor] = useState(item?.color ?? "#3291ff")
  const [tool, setTool] = useState<"draw" | "erase" | "pick">("draw")
  const [history, setHistory] = useState<string[][]>([])
  const [importing, setImporting] = useState(false)
  const [cropImage, setCropImage] = useState<ImageBitmap | null>(null)
  useEffect(() => () => cropImage?.close(), [cropImage])
  const fileRef = useRef<HTMLInputElement>(null)
  const stroke = useRef<{ x: number; y: number } | null>(null)
  function remember() {
    setHistory((previous) => [...previous.slice(-29), pixels])
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
          toast("这个格子还没有颜色", "info")
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
      toast("请选择 20 MB 以内的图片", "error")
      return
    }
    setImporting(true)
    try {
      const image = await createImageBitmap(file)
      setCropImage(image)
    } catch {
      toast("无法读取这张图片，请更换图片", "error")
    } finally {
      setImporting(false)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[90svh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item ? "编辑" : "配置"}点阵画布</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-[5rem_minmax(0,1fr)] items-start gap-3 sm:gap-5">
          <div
            role="toolbar"
            aria-label="点阵绘制工具"
            className="flex flex-col gap-2"
          >
            <input
              aria-label="画笔颜色"
              type="color"
              value={color}
              onChange={(e) => {
                setColor(e.target.value)
                setTool("draw")
              }}
              className="h-8 w-full rounded border"
            />
            <Button
              variant={tool === "draw" ? "secondary" : "outline"}
              aria-pressed={tool === "draw"}
              onClick={() => setTool("draw")}
            >
              画笔
            </Button>
            <Button
              variant={tool === "erase" ? "secondary" : "outline"}
              aria-pressed={tool === "erase"}
              onClick={() => setTool("erase")}
            >
              橡皮
            </Button>
            <Button
              variant={tool === "pick" ? "secondary" : "outline"}
              aria-pressed={tool === "pick"}
              onClick={() => setTool("pick")}
            >
              取色
            </Button>
            <Button
              variant="outline"
              disabled={!history.length || importing}
              onClick={() => {
                setPixels(history[history.length - 1])
                setHistory(history.slice(0, -1))
              }}
            >
              撤销
            </Button>
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => {
                remember()
                setPixels(blankDots(columns, rows))
              }}
            >
              清空
            </Button>
            <Button
              variant="outline"
              disabled={importing}
              onClick={() => fileRef.current?.click()}
            >
              {importing ? "转换中…" : "导入图片"}
            </Button>
            <input
              ref={fileRef}
              aria-label="导入点阵图片"
              className="hidden"
              type="file"
              accept="image/*"
              onChange={(e) => {
                void importImage(e.target.files?.[0])
                e.target.value = ""
              }}
            />
          </div>
          <div
            className="w-full min-w-0 rounded-2xl"
            style={{ aspectRatio: `${columns} / ${rows}` }}
            onPointerDown={(e) => {
              if (importing) e.stopPropagation()
            }}
          >
            <DotArt
              pixels={pixels}
              onPointerDown={(e) => {
                if (!importing) paint(e, true)
              }}
              onPointerMove={(e) => paint(e)}
              onPointerUp={() => {
                stroke.current = null
              }}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            取消
          </Button>
          <Button
            disabled={importing}
            onClick={() => {
              useTabGridStore.getState().saveItem({
                id: item?.id ?? crypto.randomUUID(),
                kind: "dot-canvas",
                name: item?.name ?? "点阵画布",
                size: "large",
                color,
                pixels,
              })
              onSaved()
            }}
          >
            {item ? "保存" : "确认添加"}
          </Button>
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
      </DialogContent>
    </Dialog>
  )
}
