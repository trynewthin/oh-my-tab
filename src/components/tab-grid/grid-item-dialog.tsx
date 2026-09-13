import Calendar from "./calendar"
import { useState } from "react"
import Ecosystem from "./ecosystem"
import EcosystemConfiguration from "./ecosystem-configuration"
import DotCanvasConfiguration from "./dot-canvas-configuration"
import DotArt from "./dot-art"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { blankDots, canvasDimensions } from "./dot-canvas-data"
import { BookmarkSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import ComponentConfiguration from "./component-configuration"
import type { GridItem } from "./types"

function ComponentPreview({
  kind,
  detail = false,
  size = "large",
}: {
  kind: "dot-canvas" | "ecosystem" | "calendar"
  size?: "small" | "medium" | "large"
  detail?: boolean
}) {
  if (kind === "calendar")
    return (
      <div
        className={`mx-auto w-full overflow-hidden rounded-2xl border ${size === "small" ? "aspect-[4/1] max-w-60" : size === "medium" ? "aspect-square max-w-28" : "aspect-square max-w-60"}`}
      >
        <Calendar
          preview
          item={{
            id: "calendar-preview",
            kind: "calendar",
            name: "日历",
            size,
            color: "#3478f6",
          }}
        />
      </div>
    )
  return kind === "ecosystem" ? (
    <div className={detail ? "size-40 [&>div]:p-0" : "mx-auto h-44 w-44"}>
      <Ecosystem
        preview
        animated={false}
        item={{
          id: "ecosystem-preview",
          kind: "ecosystem",
          name: "像素花盆",
          size: "large",
          color: "#42b883",
          species: "flowers",
          plants: [],
        }}
      />
    </div>
  ) : (
    <div
      className={
        detail
          ? "flex size-40 items-center justify-center"
          : "flex h-44 items-center justify-center p-3"
      }
    >
      <div className="aspect-square h-full max-w-full">
        <DotArt
          pixels={Array.from({ length: 576 }, (_, i) => {
            const x = i % 24
            const y = Math.floor(i / 24)
            if (x < 3 || x > 20 || y < 3 || y > 20) return ""
            if (x >= 16 && x <= 18 && y >= 5 && y <= 7) return "#f4c76b"
            if (y >= 12 + Math.abs(x - 15) && y <= 20) return "#3291ff"
            if (y >= 8 + Math.abs(x - 8) && y <= 20) return "#75c8e8"
            return ""
          })}
        />
      </div>
    </div>
  )
}

export default function GridItemDialog({
  item,
  onClose,
}: {
  item?: GridItem
  onClose: () => void
}) {
  const [selected, setSelected] = useState<
    "dot-canvas" | "ecosystem" | "calendar" | null
  >(null)
  const [confirmSize, setConfirmSize] = useState<string | false>(false)
  const saveItem = useTabGridStore((state) => state.saveItem)
  function addComponent(
    kind: "dot-canvas" | "ecosystem" | "calendar",
    size: "small" | "medium" | "large" | "tall" | "wide" | "wide-tall" = "large"
  ) {
    const id = crypto.randomUUID()
    switch (kind) {
      case "calendar":
        saveItem({
          id,
          kind,
          name: "日历",
          size: size === "small" || size === "medium" ? size : "large",
          color: "#3478f6",
        })
        break
      case "dot-canvas":
        if (size === "small" || size === "medium") return
        saveItem({
          id,
          kind,
          name: "点阵画布",
          pixels: blankDots(
            canvasDimensions(size).columns,
            canvasDimensions(size).rows
          ),
          pixelColumns: canvasDimensions(size).columns,
          size,
          color: "#3291ff",
        })
        break
      case "ecosystem":
        saveItem({
          id,
          kind,
          name: "像素花盆",
          species: "flowers",
          plants: [],
          size: "large",
          color: "#42b883",
        })
        break
    }
    onClose()
  }
  if (item?.kind === "ecosystem")
    return (
      <EcosystemConfiguration item={item} onClose={onClose} onSaved={onClose} />
    )
  if (item?.kind === "dot-canvas")
    return (
      <DotCanvasConfiguration item={item} onClose={onClose} onSaved={onClose} />
    )
  if (item)
    return (
      <ComponentConfiguration item={item} onClose={onClose} onSaved={onClose} />
    )
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <div className="flex h-[min(560px,80svh)] min-h-0 min-w-0">
          <aside className="flex w-24 shrink-0 flex-col p-2 pt-6 sm:w-44 sm:p-4 sm:pt-6">
            <DialogHeader className="px-2 pb-6 text-left">
              <DialogTitle>组件</DialogTitle>
              <DialogDescription className="sr-only">
                选择组件和大小，再次点击确认添加到主页。
              </DialogDescription>
            </DialogHeader>
            <nav aria-label="组件分类">
              <Button
                variant="secondary"
                aria-current="page"
                className="w-full justify-start px-2"
              >
                <BookmarkSimple />
                全部组件
              </Button>
            </nav>
          </aside>
          <div className="min-w-0 flex-1 space-y-5 overflow-y-auto px-3 pt-16 pb-6 sm:p-6 sm:pt-16">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {(
                [
                  {
                    id: "dot-canvas",
                    label: "点阵画布",
                    description: "绘制像素图案，或导入图片生成专属点阵装饰。",
                  },
                  {
                    id: "calendar",
                    label: "日历",
                    description: "查看月历，切换月份，快速回到今天。",
                  },
                  {
                    id: "ecosystem",
                    label: "像素花盆",
                    description:
                      "播种、浇水并陪伴植物成长，收集到你的植物图鉴。",
                  },
                ] as const
              ).map((entry) => (
                <div key={entry.id} className="min-w-0">
                  <button
                    type="button"
                    aria-label={`选择${entry.label}`}
                    aria-haspopup="dialog"
                    className="w-full min-w-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={() => {
                      if (selected !== entry.id) {
                        setSelected(entry.id)
                        setConfirmSize(false)
                      } else {
                        setSelected(null)
                        setConfirmSize(false)
                      }
                    }}
                  >
                    <ComponentPreview kind={entry.id} />
                    <span className="block px-4 pb-4 text-center text-sm font-medium">
                      {entry.label}
                    </span>
                  </button>
                </div>
              ))}
              {selected && (
                <Dialog
                  open
                  onOpenChange={(open) => {
                    if (!open) {
                      setSelected(null)
                      setConfirmSize(false)
                    }
                  }}
                >
                  <DialogContent
                    className={`grid grid-cols-1 items-center gap-6 p-6 ${selected === "calendar" ? "sm:max-w-xl sm:grid-cols-[240px_minmax(0,1fr)]" : "sm:max-w-lg sm:grid-cols-[160px_minmax(0,1fr)]"}`}
                  >
                    <ComponentPreview
                      kind={selected}
                      detail
                      size={
                        confirmSize === "small" || confirmSize === "medium"
                          ? confirmSize
                          : "large"
                      }
                    />
                    <div className="min-w-0 space-y-3">
                      <DialogTitle className="font-semibold">
                        {selected === "calendar"
                          ? "日历"
                          : selected === "ecosystem"
                            ? "像素花盆"
                            : "点阵画布"}
                      </DialogTitle>
                      <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                        {selected === "calendar"
                          ? "查看月历，切换月份，快速回到今天。"
                          : selected === "ecosystem"
                            ? "播种、浇水并陪伴植物成长，收集到你的植物图鉴。"
                            : "绘制像素图案，或导入图片生成专属点阵装饰。"}
                      </DialogDescription>
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">
                          可选大小
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {(
                            [
                              { value: "large", label: "4×4" },
                              ...(selected === "calendar"
                                ? [
                                    { value: "small", label: "4×1" },
                                    { value: "medium", label: "2×2" },
                                  ]
                                : []),
                              ...(selected === "dot-canvas"
                                ? [
                                    { value: "tall", label: "4×8" },
                                    { value: "wide", label: "8×4" },
                                    { value: "wide-tall", label: "8×8" },
                                  ]
                                : []),
                            ] as {
                              value:
                                | "small"
                                | "medium"
                                | "large"
                                | "tall"
                                | "wide"
                                | "wide-tall"
                              label: string
                            }[]
                          ).map((option) => (
                            <Button
                              key={option.value}
                              variant={
                                confirmSize === option.value
                                  ? "default"
                                  : "outline"
                              }
                              onClick={() => {
                                if (confirmSize === option.value)
                                  addComponent(selected, option.value)
                                else setConfirmSize(option.value)
                              }}
                            >
                              {confirmSize === option.value
                                ? `确认添加 · ${option.label}`
                                : option.label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
