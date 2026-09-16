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
  getComponentDefinition,
  getComponentSize,
  getComponentSizeOptions,
  isComponentSize,
  type GridItemSize,
} from "@/lib/grid/registry"
import {
  configureComponent,
  type ConfigurableItem,
} from "@/components/tab-grid/factory"

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

  function save(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTabUrl(url)
    const resolvedName = definition.showNameInEditor
      ? name.trim()
      : item?.name || definition.defaultName
    const resolvedSize = isComponentSize(kind, size)
      ? size
      : definition.defaultSize
    if (!resolvedName || (kind === "tab" && !normalized)) {
      toast("请输入名称和有效的 http / https 网址。", "error")
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
          名称
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
          网址
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
          <label htmlFor="grid-size">显示大小</label>
          <Select
            value={size}
            onValueChange={(value) => {
              if (isComponentSize(kind, value)) setSize(value)
            }}
          >
            <SelectTrigger id="grid-size" className="w-full">
              <SelectValue>{getComponentSize(kind, size)?.label}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {sizeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
      <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
        {kind === "folder" ? "文件夹颜色" : "背景颜色"}
        <input
          type="color"
          className="h-8 w-full cursor-pointer rounded border"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </label>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{item ? "保存" : "确认添加"}</Button>
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
            {item ? "编辑" : "配置"}
            {definition.label}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {definition.showNameInEditor
              ? "填写名称和可用设置后确认。"
              : "选择可用设置后确认。"}
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
