import { useCallback, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { allEntries, flushStorage } from "@/lib/storage"
import {
  formatStorageBytes,
  summarizeStorage,
  type StorageCategory,
} from "@/lib/storage-usage"
import { clearStorageCategories } from "@/lib/storage-management"
import { rehydrateData } from "@/lib/hydrate"
import { reloadVisibleFavicons } from "@/lib/favicon-cache"
import { toast } from "@/stores/toast-store"

export default function CacheDialog({
  open,
  onOpenChange,
  busy,
  setBusy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  busy: boolean
  setBusy: (busy: boolean) => void
}) {
  const [rows, setRows] = useState<ReturnType<typeof summarizeStorage>>([])
  const [selected, setSelected] = useState<StorageCategory[]>([])
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState("")

  const refresh = useCallback(async () => {
    await flushStorage()
    return summarizeStorage(await allEntries())
  }, [])

  useEffect(() => {
    if (!open) return
    let active = true
    setBusy(true)
    refresh()
      .then((rows) => {
        if (!active) return
        setRows(rows)
        setSelected([])
        setConfirming(false)
        setError("")
      })
      .catch(() => {
        if (active) setError("无法读取存储用量，请关闭后重试")
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => {
      active = false
    }
  }, [open, refresh, setBusy])

  async function clear() {
    setBusy(true)
    try {
      await clearStorageCategories(selected)
      await rehydrateData()
      if (selected.includes("icons")) reloadVisibleFavicons()
      setRows(await refresh())
      setSelected([])
      setConfirming(false)
      toast("已清除所选数据", "success")
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "清除失败，请重试",
        "error"
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!busy) onOpenChange(value)
      }}
    >
      <DialogContent
        className="max-h-[85svh] overflow-y-auto sm:max-w-md"
        aria-describedby={undefined}
      >
        <DialogTitle>管理</DialogTitle>
        {error && (
          <p role="alert" className="text-xs text-destructive">
            {error}
          </p>
        )}
        <div>
          {rows.map((row) => (
            <label
              key={row.id}
              className="flex items-center gap-3 py-3 text-sm"
            >
              <Checkbox
                aria-label={`选择${row.label}`}
                disabled={
                  busy ||
                  confirming ||
                  !row.clearable ||
                  row.clearableBytes === 0
                }
                checked={selected.includes(row.id)}
                onCheckedChange={(checked) =>
                  setSelected((current) =>
                    checked
                      ? [...current, row.id]
                      : current.filter((id) => id !== row.id)
                  )
                }
              />
              <span className="flex-1">
                {row.label}
                {!row.clearable && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    保留
                  </span>
                )}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {formatStorageBytes(row.bytes)}
              </span>
            </label>
          ))}
        </div>
        {confirming && (
          <p role="alert" className="text-sm leading-6">
            将清除
            {rows
              .filter((row) => selected.includes(row.id))
              .map((row) => `「${row.label}」`)
              .join("、")}
            。此操作无法撤销。
            {selected.includes("preferences") &&
              "个性化与搜索设置将恢复默认值。"}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="mr-auto text-xs text-muted-foreground tabular-nums">
            用量估算：
            {formatStorageBytes(rows.reduce((sum, row) => sum + row.bytes, 0))}
          </span>
          {confirming && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              取消
            </Button>
          )}
          <Button
            variant={confirming ? "destructive" : "outline"}
            disabled={busy || !selected.length || !!error}
            onClick={() => (confirming ? void clear() : setConfirming(true))}
          >
            {busy ? "处理中…" : confirming ? "确认清除" : "清除所选"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
