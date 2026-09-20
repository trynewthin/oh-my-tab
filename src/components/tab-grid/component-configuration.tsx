import { toast } from "@/stores/toast-store"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { normalizeTabUrl } from "@/lib/grid/types"
import {
  componentDefaultName,
  componentLabel,
  getComponentDefinition,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
  sizeLabel,
  type GridItemSize,
} from "@/lib/grid/registry"
import {
  configureComponent,
  type ConfigurableItem,
} from "@/lib/grid/factory"
import { useTranslation } from "react-i18next"

export default function ComponentConfiguration({
  item,
  initialKind = "tab",
  onClose,
  onSaved,
}: {
  item?: ConfigurableItem
  initialKind?: "tab" | "folder"
  onClose: () => void
  onSaved: () => void
}) {
  const { t } = useTranslation()
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const kind = item?.kind ?? initialKind
  const definition = getComponentDefinition(kind)
  const [name, setName] = useState(item?.name ?? "")
  const [url, setUrl] = useState(item?.kind === "tab" ? item.url : "")
  const [size, setSize] = useState<GridItemSize>(
    item?.size ?? definition.defaultSize
  )
  const [color, setColor] = useState(item?.color ?? definition.defaultColor)
  const saveItem = useTabGridStore((state) => state.saveItem)
  const sizeOptions = getComponentSizeOptions(kind, "editor", item?.size)
  const currentSize = getComponentSize(kind, size)

  function save(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTabUrl(url)
    const resolvedName = definition.showNameInEditor
      ? name.trim()
      : item?.name || componentDefaultName(kind, t)
    const resolvedSize = isComponentSize(kind, size)
      ? size
      : definition.defaultSize
    if (!resolvedName || (kind === "tab" && !normalized)) {
      toast(t("grid.editor.invalidTab"), "error")
      return
    }
    saveItem(
      configureComponent({
        existing: item,
        id,
        kind,
        name: resolvedName,
        size: resolvedSize,
        color,
        url: normalized ?? undefined,
      })
    )
    onSaved()
  }

  const form = (
    <form className="space-y-4" onSubmit={save}>
      {definition.showNameInEditor && (
        <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
          {t("grid.editor.name")}
          <Input
            autoFocus
            required
            maxLength={40}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>
      )}
      {kind === "tab" && (
        <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
          {t("grid.editor.url")}
          <Input
            required
            placeholder="https://example.com"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
          />
        </label>
      )}
      {sizeOptions.length > 0 && (
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
          <label htmlFor="grid-size">{t("grid.editor.displaySize")}</label>
          <Select
            value={size}
            onValueChange={(value) => {
              if (isComponentSize(kind, value)) setSize(value)
            }}
          >
            <SelectTrigger id="grid-size" className="w-full">
              <SelectValue>
                {currentSize ? sizeLabel(currentSize, t) : undefined}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {sizeLabel(option, t)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
        {kind === "folder"
          ? t("grid.editor.folderColor")
          : t("grid.editor.backgroundColor")}
        <input
          type="color"
          className="h-8 w-full cursor-pointer rounded border"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          {t("grid.editor.cancel")}
        </Button>
        <Button type="submit">
          {item ? t("grid.editor.save") : t("grid.editor.confirmAdd")}
        </Button>
      </DialogFooter>
    </form>
  )

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="max-h-[85svh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {item
              ? t("grid.editor.editTitle", { label: componentLabel(kind, t) })
              : t("grid.editor.configTitle", {
                  label: componentLabel(kind, t),
                })}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {definition.showNameInEditor
              ? t("grid.editor.descriptionWithName")
              : t("grid.editor.descriptionOptions")}
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
