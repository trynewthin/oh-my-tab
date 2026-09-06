import MotionPresence from "@/components/effects/motion-presence"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import EffectSurface from "@/components/effects/effect-surface"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogDescription,
} from "@/components/ui/dialog"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useTabGridStore } from "@/stores/tab-grid-store"

export default function BulkActions() {
  const active = useGridSelectionStore((state) => state.active)
  const ids = useGridSelectionStore((state) => state.ids)
  const finish = useGridSelectionStore((state) => state.finish)
  const items = useTabGridStore((state) => state.items)
  const selected = items.filter((item) => ids.includes(item.id))
  const [dialog, setDialog] = useState<"group" | "delete" | null>(null)
  const [name, setName] = useState("新文件夹")
  useEffect(() => {
    const close = (event: KeyboardEvent) => {
      if (
        event.key === "Escape" &&
        !event.defaultPrevented &&
        !document.querySelector('[role="dialog"]')
      )
        finish()
    }
    if (active) window.addEventListener("keydown", close)
    return () => window.removeEventListener("keydown", close)
  }, [active, finish])
  const burning = selected.length > 0 || dialog !== null
  const effectColor = useHomeSettingsStore((state) => state.color)
  return (
    <>
      {createPortal(
        <MotionPresence
          visible={active}
          direction="bottom"
          role="toolbar"
          aria-label="批量操作"
          className="fixed inset-x-4 bottom-6 isolate z-40 mx-auto w-fit max-w-[calc(100%-2rem)] rounded-2xl border bg-popover p-2 text-popover-foreground shadow-xl"
          data-effect={burning ? "burning" : "static"}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]"
          >
            <EffectSurface
              textureId={"selection-bar"}
              color={effectColor}
              animated={burning}
            />
          </div>
          <div className="relative z-10 flex flex-wrap items-center justify-center gap-2">
            <span role="status" className="px-2 text-sm">
              已选 {selected.length} 项
            </span>
            <Button
              variant="ghost"
              onClick={() =>
                useGridSelectionStore.setState({
                  ids:
                    selected.length === items.length
                      ? []
                      : items.map((item) => item.id),
                })
              }
            >
              {items.length > 0 && selected.length === items.length
                ? "取消全选"
                : "全选"}
            </Button>
            <Button
              variant="secondary"
              disabled={
                selected.length < 2 ||
                selected.some(
                  (item) =>
                    item.kind === "dot-canvas" || item.kind === "ecosystem"
                )
              }
              title={
                selected.some(
                  (item) =>
                    item.kind === "dot-canvas" || item.kind === "ecosystem"
                )
                  ? "文件夹仅支持收纳书签"
                  : undefined
              }
              onClick={() => {
                setName("新文件夹")
                setDialog("group")
              }}
            >
              成组
            </Button>
            <Button
              variant="destructive"
              disabled={!selected.length}
              onClick={() => setDialog("delete")}
            >
              删除
            </Button>
            <Button variant="ghost" onClick={finish}>
              完成
            </Button>
          </div>
        </MotionPresence>,
        document.body
      )}
      <Dialog
        open={dialog !== null}
        onOpenChange={(open) => {
          if (!open) setDialog(null)
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog === "group" ? "成组" : "删除组件"}
            </DialogTitle>
            <DialogDescription>
              {dialog === "group"
                ? "将选中的标签和文件夹内书签合并到新文件夹。"
                : `删除选中的 ${selected.length} 个组件，包含文件夹内的书签。删除后可通过通知撤销。`}
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault()
              const keys = selected.map((item) => item.id)
              if (dialog === "group") {
                if (!useTabGridStore.getState().groupItems(keys, name)) return
              } else useTabGridStore.getState().removeItems(keys)
              setDialog(null)
              finish()
            }}
          >
            {dialog === "group" && (
              <label className="grid gap-2 text-sm">
                文件夹名称
                <Input
                  autoFocus
                  required
                  maxLength={40}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                />
              </label>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={
                  dialog === "group"
                    ? selected.length < 2 || !name.trim()
                    : !selected.length
                }
              >
                {dialog === "group" ? "确认成组" : "确认删除"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
