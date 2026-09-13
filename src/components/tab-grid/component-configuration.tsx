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
  item?: Exclude<GridItem, { kind: "dot-canvas" | "ecosystem" }>
  initialKind?: "tab" | "folder"
  onClose: () => void
  onSaved: () => void
}) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const kind = item?.kind ?? initialKind
  const [name, setName] = useState(item?.name ?? "")
  const [url, setUrl] = useState(item?.kind === "tab" ? item.url : "")
  const [size, setSize] = useState<
    "small" | "medium" | "large" | "tall" | "wide" | "wide-tall"
  >(item?.size ?? (kind === "folder" ? "large" : "small"))
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
    else if (kind === "todo")
      saveItem({
        id,
        kind,
        name: name.trim(),
        size: size === "small" || size === "medium" ? size : "large",
        color,
        tasks: item?.kind === "todo" ? item.tasks : [],
        dynamicEffect: item?.dynamicEffect ?? false,
      })
    else if (kind === "calendar")
      saveItem({
        id,
        kind,
        name: name.trim(),
        size: size === "small" || size === "medium" ? size : "large",
        color,
        dynamicEffect: item?.dynamicEffect ?? false,
      })
    else
      saveItem({
        id,
        kind,
        name: name.trim(),
        size:
          size === "small" ||
          size === "tall" ||
          size === "wide" ||
          size === "wide-tall"
            ? size
            : "large",
        color,
        tabs: item?.kind === "folder" ? item.tabs : [],
        dynamicEffect: item?.kind === "folder" ? item.dynamicEffect : false,
      })
    onSaved()
  }

  const form = (
    <form className="space-y-4" onSubmit={save}>
      {kind !== "calendar" && (
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
      {kind !== "todo" && (
        <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-2 sm:gap-3">
          <label htmlFor="grid-size">显示大小</label>
          <Select
            value={size}
            onValueChange={(value) => {
              if (
                value === "small" ||
                value === "medium" ||
                value === "large" ||
                value === "tall" ||
                value === "wide" ||
                value === "wide-tall"
              )
                setSize(value)
            }}
          >
            <SelectTrigger id="grid-size" className="w-full">
              <SelectValue>
                {kind === "calendar"
                  ? size === "small"
                    ? "周 · 4×1"
                    : size === "medium"
                      ? "日 · 2×2"
                      : "月 · 4×4"
                  : kind === "tab"
                    ? size === "small"
                      ? "小 · 4×1"
                      : "中 · 4×2"
                    : size === "small"
                      ? "小 · 4×2"
                      : size === "wide"
                        ? "宽 · 8×4"
                        : size === "wide-tall"
                          ? "宽高 · 8×8"
                          : size === "tall"
                            ? "高 · 4×8"
                            : "大 · 4×4"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {kind === "folder" && item?.size === "small" && (
                <SelectItem value="small">小 · 4×2</SelectItem>
              )}
              {kind === "calendar" && (
                <>
                  <SelectItem value="small">周 · 4×1</SelectItem>
                  <SelectItem value="medium">日 · 2×2</SelectItem>
                </>
              )}
              {kind === "tab" && (
                <SelectItem value="small">小 · 4×1</SelectItem>
              )}
              <SelectItem value={kind === "tab" ? "medium" : "large"}>
                {kind === "tab" ? "中 · 4×2" : "大 · 4×4"}
              </SelectItem>
              {kind === "folder" && (
                <>
                  <SelectItem value="tall">高 · 4×8</SelectItem>
                  <SelectItem value="wide">宽 · 8×4</SelectItem>
                  <SelectItem value="wide-tall">宽高 · 8×8</SelectItem>
                </>
              )}
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
            {kind === "tab"
              ? "标签"
              : kind === "calendar"
                ? "日历"
                : kind === "todo"
                  ? "待办"
                  : "文件夹"}
          </DialogTitle>
          <DialogDescription className="sr-only">
            {kind === "calendar"
              ? "选择显示大小和颜色后确认。"
              : "填写名称、显示大小和颜色后确认。"}
          </DialogDescription>
        </DialogHeader>
        {form}
      </DialogContent>
    </Dialog>
  )
}
