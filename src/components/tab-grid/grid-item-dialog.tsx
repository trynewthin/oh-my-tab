import Todo from "./todo"
import Calendar from "./calendar"
import { useState } from "react"
import Ecosystem from "./ecosystem"
import EcosystemConfiguration from "./ecosystem-configuration"
import DotCanvasConfiguration from "./dot-canvas-configuration"
import DotArt from "./dot-art"
import { useTabGridStore } from "@/stores/tab-grid-store"
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
import type { ComponentProps } from "react"
import type { GridItem } from "@/lib/grid/types"
import {
  catalogComponentKinds,
  getComponentDefinition,
  getComponentSizeOptions,
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import { createCatalogComponent } from "@/components/tab-grid/factory"

function PreviewContent({
  kind,
  detail = false,
  size,
}: {
  kind: CatalogComponentKind
  size?: GridItemSize
  detail?: boolean
}) {
  const resolved = size ?? getComponentDefinition(kind).defaultSize
  if (kind === "todo")
    return (
      <div
        className={`mx-auto w-full max-w-60 overflow-hidden rounded-2xl border ${resolved === "small" ? "aspect-[4/1]" : resolved === "medium" ? "aspect-[2/1]" : "aspect-square"}`}
      >
        <Todo
          preview
          item={{
            id: "todo-preview",
            kind: "todo",
            name: getComponentDefinition(kind).defaultName,
            size:
              resolved === "small" || resolved === "medium"
                ? resolved
                : "large",
            color: getComponentDefinition(kind).defaultColor,
            tasks: [
              { id: "1", text: "整理今天的计划", done: true },
              { id: "2", text: "读几页喜欢的书", done: false },
            ],
          }}
        />
      </div>
    )
  if (kind === "calendar")
    return (
      <div
        className={`mx-auto w-full overflow-hidden rounded-2xl border ${!detail ? "aspect-square max-w-60" : resolved === "small" ? "aspect-[4/1] max-w-60" : resolved === "medium" ? "aspect-square max-w-28" : "aspect-square max-w-60"}`}
      >
        <Calendar
          preview
          item={{
            id: "calendar-preview",
            kind: "calendar",
            name: getComponentDefinition(kind).defaultName,
            size:
              resolved === "small" || resolved === "medium"
                ? resolved
                : "large",
            color: getComponentDefinition(kind).defaultColor,
          }}
        />
      </div>
    )
  return kind === "ecosystem" ? (
    <div
      className={
        detail
          ? "size-40 [&>div]:p-0"
          : "mx-auto aspect-square w-full max-w-60 [&>div]:p-0"
      }
    >
      <Ecosystem
        preview
        animated={false}
        item={{
          id: "ecosystem-preview",
          kind: "ecosystem",
          name: getComponentDefinition(kind).defaultName,
          size: "large",
          color: getComponentDefinition(kind).defaultColor,
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
          : "mx-auto flex aspect-square w-full max-w-60 items-center justify-center"
      }
    >
      <div className="aspect-square w-full">
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

function ComponentPreview(props: ComponentProps<typeof PreviewContent>) {
  if (props.detail) return <PreviewContent {...props} />
  return (
    <div className="[container-type:inline-size] mx-auto aspect-square w-full max-w-48">
      <div className="size-60 origin-top-left [transform:scale(calc(100cqw/240px))]">
        <PreviewContent {...props} />
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
  const [selected, setSelected] = useState<CatalogComponentKind | null>(null)
  const [confirmSize, setConfirmSize] = useState<GridItemSize | false>(false)
  const saveItem = useTabGridStore((state) => state.saveItem)
  function addComponent(kind: CatalogComponentKind, size?: GridItemSize) {
    saveItem(createCatalogComponent(kind, size))
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
              {catalogComponentKinds.map((kind) => {
                const entry = getComponentDefinition(kind)
                return (
                  <div key={kind} className="min-w-0">
                    <button
                      type="button"
                      aria-label={`选择${entry.label}`}
                      aria-haspopup="dialog"
                      className="w-full min-w-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => {
                        if (selected !== kind) {
                          setSelected(kind)
                          setConfirmSize(false)
                        } else {
                          setSelected(null)
                          setConfirmSize(false)
                        }
                      }}
                    >
                      <ComponentPreview kind={kind} />
                      <span className="block px-4 pb-4 text-center text-sm font-medium">
                        {entry.label}
                      </span>
                    </button>
                  </div>
                )
              })}
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
                    className={`grid grid-cols-1 items-center gap-6 p-6 ${getComponentDefinition(selected).detailPreviewWidth === "wide" ? "sm:max-w-xl sm:grid-cols-[240px_minmax(0,1fr)]" : "sm:max-w-lg sm:grid-cols-[160px_minmax(0,1fr)]"}`}
                  >
                    <ComponentPreview
                      kind={selected}
                      detail
                      size={
                        confirmSize ||
                        getComponentDefinition(selected).defaultSize
                      }
                    />
                    <div className="min-w-0 space-y-3">
                      <DialogTitle className="font-semibold">
                        {getComponentDefinition(selected).label}
                      </DialogTitle>
                      <DialogDescription className="text-sm leading-relaxed text-muted-foreground">
                        {getComponentDefinition(selected).description}
                      </DialogDescription>
                      {getComponentDefinition(selected).catalogDirectAdd ? (
                        <Button onClick={() => addComponent(selected)}>
                          确认添加
                        </Button>
                      ) : (
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            可选大小
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {getComponentSizeOptions(selected, "catalog").map(
                              (option) => (
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
                                    ? `确认添加 · ${option.menuLabel}`
                                    : option.menuLabel}
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      )}
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
