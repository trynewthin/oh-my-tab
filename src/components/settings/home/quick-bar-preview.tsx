import { PencilSimple, Plus, Trash } from "@phosphor-icons/react"
import { type DragEvent, useState } from "react"
import { useTranslation } from "react-i18next"

import { QuickBarCenter, QuickBarGlyph } from "@/components/home/quick-bar"
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { buttonActionLabelKeys } from "@/lib/grid/button-actions"
import {
  MAX_QUICK_CONTROLS_PER_SIDE,
  type QuickBarControl,
  type QuickBarSide,
} from "@/lib/quick-bar"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { QuickBarSideEditor, SiteFields } from "./quick-bar-pane"

function PreviewControl({
  control,
  onEdit,
  onRemove,
}: {
  control: QuickBarControl
  onEdit: () => void
  onRemove: () => void
}) {
  const { t } = useTranslation()
  const name =
    control.kind === "site"
      ? control.name
      : t(`grid.editor.buttonActions.${buttonActionLabelKeys[control.action]}`)
  return (
    <ContextMenu>
      <ContextMenuTrigger
        render={
          <button
            type="button"
            draggable
            data-quick-control-id={control.id}
            aria-label={name}
            title={name}
            className="flex size-7 shrink-0 cursor-grab items-center justify-center rounded-lg text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "move"
              event.dataTransfer.setData("text/plain", control.id)
            }}
          >
            <QuickBarGlyph control={control} />
          </button>
        }
      />
      <ContextMenuContent>
        {control.kind === "site" && (
          <ContextMenuItem onClick={onEdit}>
            <PencilSimple />
            {t("grid.menu.edit")}
          </ContextMenuItem>
        )}
        <ContextMenuItem variant="destructive" onClick={onRemove}>
          <Trash />
          {t("settings.home.quickBarRemove", { name })}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  )
}

function PreviewSide({
  side,
  controls,
  onEdit,
  onAdd,
}: {
  side: QuickBarSide
  controls: QuickBarControl[]
  onEdit: (control: Extract<QuickBarControl, { kind: "site" }>) => void
  onAdd: (side: QuickBarSide) => void
}) {
  const place = useHomeSettingsStore((state) => state.placeQuickControl)
  const { t } = useTranslation()
  const label = t(
    side === "left"
      ? "settings.home.quickBarLeft"
      : "settings.home.quickBarRight"
  )
  const addButton = (
    <button
      type="button"
      aria-label={t("settings.home.quickBarAddToSide", { name: label })}
      title={t("settings.home.quickBarAddToSide", { name: label })}
      className="flex size-7 shrink-0 items-center justify-center rounded-lg text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-40"
      disabled={controls.length >= MAX_QUICK_CONTROLS_PER_SIDE}
      onClick={() => onAdd(side)}
    >
      <Plus className="size-4" />
    </button>
  )
  const remove = useHomeSettingsStore((state) => state.removeQuickControl)
  function drop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault()
    const id = event.dataTransfer.getData("text/plain")
    const buttons = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        "[data-quick-control-id]"
      )
    )
    const before = buttons.findIndex((button) => {
      const bounds = button.getBoundingClientRect()
      return event.clientX < bounds.left + bounds.width / 2
    })
    place(id, side, before < 0 ? buttons.length : before)
  }
  return (
    <div
      data-quick-bar-side={side}
      className="min-w-0 [scrollbar-width:none] overflow-x-auto [&::-webkit-scrollbar]:hidden"
      onDragOver={(event) => {
        event.preventDefault()
        event.dataTransfer.dropEffect = "move"
      }}
      onDrop={drop}
    >
      <div
        className={`flex w-max min-w-full items-center gap-1 ${side === "right" ? "justify-end" : ""}`}
      >
        {side === "right" && addButton}
        {controls.map((control) => (
          <PreviewControl
            key={control.id}
            control={control}
            onEdit={() => {
              if (control.kind === "site") onEdit(control)
            }}
            onRemove={() => remove(control.id)}
          />
        ))}
        {side === "left" && addButton}
      </div>
    </div>
  )
}

export default function QuickBarPreview() {
  const { t } = useTranslation()
  const quickBar = useHomeSettingsStore((state) => state.quickBar)
  const updateSite = useHomeSettingsStore(
    (state) => state.updateQuickSiteControl
  )
  const [editing, setEditing] = useState<
    Extract<QuickBarControl, { kind: "site" }> | undefined
  >()
  const [addingSide, setAddingSide] = useState<QuickBarSide | null>(null)

  return (
    <div className="rounded-2xl bg-card px-2 py-1 shadow-[0_0_14px_rgba(0,0,0,0.14)] dark:shadow-[0_0_18px_rgba(0,0,0,0.4)]">
      <div
        data-quick-bar-preview
        role="group"
        aria-label={t("settings.home.quickBarPreview")}
        className="grid h-7 w-full grid-cols-3 items-center"
      >
        <PreviewSide
          side="left"
          controls={quickBar.left}
          onEdit={setEditing}
          onAdd={setAddingSide}
        />
        <QuickBarCenter key={quickBar.center.kind} center={quickBar.center} />
        <PreviewSide
          side="right"
          controls={quickBar.right}
          onEdit={setEditing}
          onAdd={setAddingSide}
        />
      </div>
      <Dialog
        open={addingSide !== null}
        onOpenChange={(open) => !open && setAddingSide(null)}
      >
        <DialogContent className="sm:max-w-md">
          {addingSide && (
            <QuickBarSideEditor
              side={addingSide}
              onAdded={() => setAddingSide(null)}
            />
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editing}
        onOpenChange={(open) => !open && setEditing(undefined)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {t("settings.home.quickBarEdit", { name: editing?.name ?? "" })}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <SiteFields
              key={editing.id}
              initial={editing}
              onSave={(name, url) => {
                const saved = updateSite(editing.id, name, url)
                if (saved) setEditing(undefined)
                return saved
              }}
              onCancel={() => setEditing(undefined)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
