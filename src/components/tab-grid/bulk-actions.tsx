import MotionPresence from "@/components/effects/motion-presence"
import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import { Selection, FolderPlus, Trash, Check } from "@phosphor-icons/react"
import MarqueeSelection from "./marquee-selection"
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

function BulkActionButton({
  label,
  children,
  ...props
}: ComponentProps<typeof Button> & { label: string; children: ReactNode }) {
  return (
    <Button
      {...props}
      aria-label={label}
      className="group h-14 min-w-14 gap-0 rounded-full border-[1.75px] border-foreground/20 bg-popover px-[10.375px] text-sm font-semibold text-popover-foreground shadow-lg transition-colors hover:bg-muted aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
    >
      {children}
      <span className="grid min-w-0 grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-200 ease-out group-hover:grid-cols-[1fr] group-hover:opacity-100 group-focus-visible:grid-cols-[1fr] group-focus-visible:opacity-100 motion-reduce:transition-none">
        <span className="min-w-0 overflow-hidden">
          <span className="pl-[7px]">{label}</span>
        </span>
      </span>
    </Button>
  )
}

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
  const [selecting, setSelecting] = useState(false)
  useEffect(() => {
    if (!active) setSelecting(false)
  }, [active])
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
  return (
    <>
      {active && selecting && dialog === null && <MarqueeSelection />}
      {createPortal(
        <MotionPresence
          visible={active}
          direction="bottom"
          role="toolbar"
          aria-label={t("grid.bulk.toolbar")}
          className="fixed inset-x-4 bottom-6 z-40 mx-auto flex w-fit max-w-[calc(100%-2rem)] items-center gap-[7px]"
        >
          <BulkActionButton
            label={t("grid.bulk.select")}
            aria-pressed={selecting}
            onClick={() => setSelecting((value) => !value)}
          >
            <Selection weight="bold" className="size-[31.5px] stroke-current [stroke-width:1.3125]" />
          </BulkActionButton>
          <BulkActionButton
            label={t("grid.bulk.group")}
            disabled={groupAction.kind === "disabled"}
            title={groupAction.kind === "disabled" ? t("grid.bulk.groupDisabled") : undefined}
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
            <FolderPlus weight="bold" className="size-[31.5px] stroke-current [stroke-width:1.3125]" />
          </BulkActionButton>
          <BulkActionButton
            label={t("grid.bulk.delete")}
            disabled={!selected.length}
            onClick={() => setDialog("delete")}
          >
            <Trash weight="bold" className="size-[31.5px] stroke-current text-destructive [stroke-width:1.3125]" />
          </BulkActionButton>
          <BulkActionButton label={t("grid.bulk.done")} onClick={finish}>
            <Check weight="bold" className="size-[31.5px] stroke-current [stroke-width:1.3125]" />
          </BulkActionButton>
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
