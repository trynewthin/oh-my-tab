import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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

export default function GridItemDialog({
  item,
  onClose,
}: {
  item?: GridItem
  onClose: () => void
}) {
  const [id] = useState(() => item?.id ?? crypto.randomUUID())
  const [kind, setKind] = useState<"tab" | "folder">(item?.kind ?? "tab")
  const [name, setName] = useState(item?.name ?? "")
  const [url, setUrl] = useState(item?.kind === "tab" ? item.url : "")
  const [size, setSize] = useState<"small" | "medium" | "large" | "tall">(
    item?.size ?? "small"
  )
  const [color, setColor] = useState(item?.color ?? "#6c8bd4")
  const [error, setError] = useState("")
  const saveItem = useTabGridStore((state) => state.saveItem)

  function save(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTabUrl(url)
    if (!name.trim() || (kind === "tab" && !normalized)) {
      setError("请输入名称和有效的 http / https 网址。")
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
    onClose()
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>
            {item ? "编辑" : "添加"}
            {kind === "tab" ? "标签" : "文件夹"}
          </DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={save}>
          {!item && (
            <div className="grid grid-cols-2 items-center gap-3">
              <label htmlFor="grid-kind">类型</label>
              <Select
                value={kind}
                onValueChange={(value) => {
                  if (value === "tab" || value === "folder") {
                    setKind(value)
                    setSize("small")
                  }
                }}
              >
                <SelectTrigger id="grid-kind" className="w-full">
                  <SelectValue>
                    {kind === "tab" ? "标签" : "文件夹"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tab">标签</SelectItem>
                  <SelectItem value="folder">文件夹</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <label className="grid grid-cols-2 items-center gap-3">
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
            <label className="grid grid-cols-2 items-center gap-3">
              网址
              <Input
                required
                placeholder="https://example.com"
                value={url}
                onChange={(event) => setUrl(event.target.value)}
              />
            </label>
          )}
          <div className="grid grid-cols-2 items-center gap-3">
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
          <label className="grid grid-cols-2 items-center gap-3">
            {kind === "folder" ? "文件夹颜色" : "背景颜色"}
            <input
              type="color"
              className="h-8 w-full cursor-pointer rounded border"
              value={color}
              onChange={(event) => setColor(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
