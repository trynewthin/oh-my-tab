import { toast } from "@/stores/toast-store"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
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
import { normalizeTabUrl, type GridItem } from "./types"

export default function ComponentConfiguration({
  item,
  initialKind = "tab",
  onClose,
  onSaved,
}: {
  item?: GridItem
  initialKind?: "tab" | "folder"
  onClose: () => void
  onSaved: () => void
}) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const kind = item?.kind ?? initialKind
  const [name, setName] = useState(item?.name ?? "")
  const [url, setUrl] = useState(item?.kind === "tab" ? item.url : "")
  const [size, setSize] = useState<"small" | "medium" | "large" | "tall">(
    item?.size ?? "small"
  )
  const [color, setColor] = useState(item?.color ?? "#6c8bd4")
  const saveItem = useTabGridStore((state) => state.saveItem)

  function save(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTabUrl(url)
    if (!name.trim() || (kind === "tab" && !normalized)) {
      toast("请输入名称和有效的 http / https 网址。", "error")
      return
    }
    if (kind === "tab")
      saveItem({
        id,
        kind,
        name: name.trim(),
        url: normalized!,
        dynamicEffect: item?.kind === "tab" ? item.dynamicEffect : false,
        size: size === "medium" ? "medium" : "small",
        color,
      })
    else
      saveItem({
        id,
        kind,
        name: name.trim(),
        size: size === "large" || size === "tall" ? size : "small",
        color,
        tabs: item?.kind === "folder" ? item.tabs : [],
        dynamicEffect: item?.kind === "folder" ? item.dynamicEffect : false,
      })
    onSaved()
  }

  const form = (
    <form className="space-y-4" onSubmit={save}>
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
      <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
        <label htmlFor="grid-size">显示大小</label>
        <Select
          value={size}
          onValueChange={(value) => {
            if (
              value === "small" ||
              value === "medium" ||
              value === "large" ||
              value === "tall"
            )
              setSize(value)
          }}
        >
          <SelectTrigger id="grid-size" className="w-full">
            <SelectValue>
              {size === "small"
                ? kind === "tab"
                  ? "小 · 4×1"
                  : "小 · 4×2"
                : kind === "tab"
                  ? "中 · 4×2"
                  : size === "tall"
                    ? "高 · 4×8"
                    : "大 · 4×4"}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">
              {kind === "tab" ? "小 · 4×1" : "小 · 4×2"}
            </SelectItem>
            <SelectItem value={kind === "tab" ? "medium" : "large"}>
              {kind === "tab" ? "中 · 4×2" : "大 · 4×4"}
            </SelectItem>
            {kind === "folder" && (
              <SelectItem value="tall">高 · 4×8</SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <label className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
        {kind === "folder" ? "文件夹颜色" : "背景颜色"}
        <input
          type="color"
          className="h-8 w-full cursor-pointer rounded border"
          value={color}
          onChange={(event) => setColor(event.target.value)}
        />
      </label>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          取消
        </Button>
        <Button type="submit">{item ? "保存" : "确认添加"}</Button>
      </div>
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
            {kind === "tab" ? "标签" : "文件夹"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            填写名称、显示大小和颜色后确认。
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
