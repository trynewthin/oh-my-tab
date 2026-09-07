import Ecosystem from "./ecosystem"
import EcosystemConfiguration from "./ecosystem-configuration"
import DotCanvasConfiguration from "./dot-canvas-configuration"
import DotArt from "./dot-art"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { blankDots } from "./dot-canvas-data"
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

export default function GridItemDialog({
  item,
  onClose,
}: {
  item?: GridItem
  onClose: () => void
}) {
  const saveItem = useTabGridStore((state) => state.saveItem)
  function addComponent(kind: "dot-canvas" | "ecosystem") {
    const id = crypto.randomUUID()
    switch (kind) {
      case "dot-canvas":
        saveItem({
          id,
          kind,
          name: "点阵画布",
          pixels: blankDots(),
          size: "large",
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
                点击组件即可添加到主页。
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
                  { id: "dot-canvas", label: "点阵画布" },
                  { id: "ecosystem", label: "像素花盆" },
                ] as const
              ).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`添加${entry.label}`}
                  className="min-w-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => addComponent(entry.id)}
                >
                  {entry.id === "ecosystem" ? (
                    <div className="h-44">
                      <Ecosystem
                        preview
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
                    <div className="flex h-44 items-center justify-center p-3">
                      <div className="aspect-square h-full max-w-full">
                        <DotArt
                          pixels={Array.from({ length: 576 }, (_, i) =>
                            Math.hypot(
                              (i % 24) - 11.5,
                              Math.floor(i / 24) - 11.5
                            ) < 6
                              ? "#3291ff"
                              : ""
                          )}
                        />
                      </div>
                    </div>
                  )}
                  <span className="block px-4 pb-4 text-center text-sm font-medium">
                    {entry.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
