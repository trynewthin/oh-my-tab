import { useCallback, useEffect, useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { allEntries, flushStorage } from "@/lib/storage"
import {
  formatStorageBytes,
  summarizeStorage,
  type StorageCategory,
  type StorageUsageRow,
} from "@/lib/storage-usage"
import { clearStorageCategories } from "@/application/storage-management"
import { rehydrateData } from "@/application/hydrate"
import { reloadVisibleFavicons } from "@/application/favicon-cache"
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
  const { t } = useTranslation()
  const [rows, setRows] = useState<StorageUsageRow[]>([])
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
        if (active) setError(t("settings.cache.readError"))
      })
      .finally(() => {
        if (active) setBusy(false)
      })
    return () => {
      active = false
    }
  }, [open, refresh, setBusy, t])

  async function clear() {
    setBusy(true)
    try {
      await clearStorageCategories(selected)
      await rehydrateData()
      if (selected.includes("icons")) reloadVisibleFavicons()
      setRows(await refresh())
      setSelected([])
      setConfirming(false)
      toast(t("settings.cache.cleared"), "success")
    } catch (error) {
      toast(
        error instanceof Error ? error.message : t("settings.cache.clearFailed"),
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
        <DialogTitle>{t("settings.common.manage")}</DialogTitle>
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
                aria-label={t("settings.cache.selectAria", {
                  name: t(row.labelKey),
                })}
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
                {t(row.labelKey)}
                {!row.clearable && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    {t("settings.cache.retained")}
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
            {t("settings.cache.confirmPrefix")}
            {rows
              .filter((row) => selected.includes(row.id))
              .map((row) =>
                t("settings.cache.confirmItem", { name: t(row.labelKey) })
              )
              .join(t("settings.cache.confirmSeparator"))}
            {t("settings.cache.confirmSuffix")}
            {selected.includes("preferences") &&
              t("settings.cache.confirmPreferences")}
          </p>
        )}
        <div className="flex items-center gap-2">
          <span className="mr-auto text-xs text-muted-foreground tabular-nums">
            {t("settings.cache.estimatedUsage")}
            {formatStorageBytes(rows.reduce((sum, row) => sum + row.bytes, 0))}
          </span>
          {confirming && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => setConfirming(false)}
            >
              {t("settings.common.cancel")}
            </Button>
          )}
          <Button
            variant={confirming ? "destructive" : "outline"}
            disabled={busy || !selected.length || !!error}
            onClick={() => (confirming ? void clear() : setConfirming(true))}
          >
            {busy
              ? t("settings.common.processing")
              : confirming
                ? t("settings.cache.confirmClear")
                : t("settings.cache.clearSelected")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
