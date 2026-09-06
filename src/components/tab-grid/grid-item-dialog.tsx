import Ecosystem from "./ecosystem"
import EcosystemConfiguration from "./ecosystem-configuration"
import DotCanvasConfiguration from "./dot-canvas-configuration"
import DotArt from "./dot-art"
import { useState } from "react"
import { BookmarkSimple } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import TabBackground from "./tab-background"
import FolderBackground from "./folder-background"
import ComponentConfiguration from "./component-configuration"
import type { GridItem } from "./types"

function BookmarkPreview({ folder = false }: { folder?: boolean }) {
  const tile = (name: string, color: string) => (
    <div className="relative isolate h-11 min-w-0 rounded-2xl border">
      <TabBackground
        item={{ id: name, kind: "tab", name, url: "", size: "small", color }}
        showIcon={false}
      />
      <span className="relative z-10 flex h-full items-center px-4 pr-12 text-sm font-medium">
        {name}
      </span>
      <BookmarkSimple className="absolute top-1/2 right-4 z-10 size-5 -translate-y-1/2" />
    </div>
  )
  return (
    <div
      aria-hidden="true"
      className="flex h-44 w-full items-center justify-center p-3"
    >
      {folder ? (
        <div className="relative isolate w-full rounded-2xl border p-3">
          <FolderBackground color="#a58bc6" />
          <div className="relative z-10 space-y-2 text-left">
            <span className="block text-sm font-medium">常用网站</span>
            {tile("设计灵感", "#a58bc6")}
            {tile("阅读收藏", "#a58bc6")}
          </div>
        </div>
      ) : (
        <div className="w-full">{tile("我的书签", "#6c8bd4")}</div>
      )}
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
    "tab" | "folder" | "dot-canvas" | "ecosystem" | null
  >(null)
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
                选择组件预览，配置后添加到主页。
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
                  { id: "tab", label: "标签" },
                  { id: "folder", label: "文件夹" },
                  { id: "dot-canvas", label: "点阵画布" },
                  { id: "ecosystem", label: "像素花盆" },
                ] as const
              ).map((entry) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`添加${entry.label}`}
                  className="min-w-0 rounded-2xl text-left outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  onClick={() => setSelected(entry.id)}
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
                  ) : entry.id === "dot-canvas" ? (
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
                  ) : (
                    <BookmarkPreview folder={entry.id === "folder"} />
                  )}
                  <span className="block px-4 pb-4 text-center text-sm font-medium">
                    {entry.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
        {selected === "ecosystem" ? (
          <EcosystemConfiguration
            onClose={() => setSelected(null)}
            onSaved={onClose}
          />
        ) : selected === "dot-canvas" ? (
          <DotCanvasConfiguration
            onClose={() => setSelected(null)}
            onSaved={onClose}
          />
        ) : (
          selected && (
            <ComponentConfiguration
              key={selected}
              initialKind={selected}
              onClose={() => setSelected(null)}
              onSaved={onClose}
            />
          )
        )}
      </DialogContent>
    </Dialog>
  )
}
