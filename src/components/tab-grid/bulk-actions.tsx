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
  DialogFooter,
} from "@/components/ui/dialog"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { resolveGroupAction } from "@/lib/grid/grid-operations"
import { useTranslation } from "react-i18next"

export default function BulkActions() {
  const { t } = useTranslation()
  const active = useGridSelectionStore((state) => state.active)
  const ids = useGridSelectionStore((state) => state.ids)
  const finish = useGridSelectionStore((state) => state.finish)
  const items = useTabGridStore((state) => state.items)
  const selected = items.filter((item) => ids.includes(item.id))
  const groupAction = resolveGroupAction(selected)
  const [dialog, setDialog] = useState<"group" | "delete" | null>(null)
  const [name, setName] = useState("")
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
          aria-label={t("grid.bulk.toolbar")}
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
          <div className="relative z-10 flex min-w-56 items-center justify-between gap-8">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={groupAction.kind === "disabled"}
                title={
                  groupAction.kind === "disabled"
                    ? t("grid.bulk.groupDisabled")
                    : undefined
                }
                onClick={() => {
                  const keys = selected.map((item) => item.id)
                  if (groupAction.kind === "move") {
                    if (useTabGridStore.getState().groupItems(keys)) finish()
                    return
                  }
                  setName(t("grid.component.folder.defaultName"))
                  setDialog("group")
                }}
              >
                {t("grid.bulk.group")}
              </Button>
              <Button
                variant="destructive"
                disabled={!selected.length}
                onClick={() => setDialog("delete")}
              >
                {t("grid.bulk.delete")}
              </Button>
            </div>
            <Button variant="ghost" onClick={finish}>
              {t("grid.bulk.done")}
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
              {dialog === "group"
                ? t("grid.bulk.folderName")
                : t("grid.bulk.deleteTitle")}
            </DialogTitle>
            {dialog !== "group" && (
              <DialogDescription>
                {t("grid.bulk.deleteDescription", {
                  count: selected.length,
                })}
              </DialogDescription>
            )}
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
              <Input
                autoFocus
                required
                maxLength={40}
                aria-label={t("grid.bulk.folderName")}
                value={name}
                onChange={(event) => setName(event.target.value)}
              />
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialog(null)}
              >
                {t("grid.editor.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  dialog === "group"
                    ? selected.length < 2 || !name.trim()
                    : !selected.length
                }
              >
                {dialog === "group"
                  ? t("grid.bulk.confirmGroup")
                  : t("grid.bulk.confirmDelete")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}
