import { ArrowClockwise, UploadSimple } from "@phosphor-icons/react"
import { useState } from "react"
import { useTranslation } from "react-i18next"
import SettingItem from "@/components/settings/shared/setting-item"
import { settingsControlClassName } from "@/components/settings/shared/control-styles"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { refreshFavicon } from "@/application/favicon-cache"
import { prepareTabIcon } from "@/lib/grid/tab-icon"
import { normalizeTabUrl } from "@/lib/grid/types"
import { toast } from "@/stores/toast-store"

export default function TabIconControls({
  url,
  icon,
  onIconChange,
  alertClassName,
  alertOverlayClassName,
}: {
  url: string
  icon?: string
  onIconChange: (icon: string | undefined) => void
  alertClassName?: string
  alertOverlayClassName?: string
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [refreshOpen, setRefreshOpen] = useState(false)

  async function refresh() {
    const normalized = normalizeTabUrl(url)
    if (!normalized) {
      toast(t("grid.editor.invalidTab"), "error")
      return
    }
    setBusy(true)
    try {
      const icon = await refreshFavicon(normalized)
      if (!icon) throw new Error("faviconUnavailable")
      onIconChange(undefined)
      toast(t("grid.editor.iconRefreshed"), "success")
    } catch {
      toast(t("grid.editor.iconRefreshFailed"), "error")
    } finally {
      setBusy(false)
    }
  }

  async function upload(file?: File) {
    if (!file) return
    setBusy(true)
    try {
      onIconChange(await prepareTabIcon(file))
    } catch {
      toast(t("grid.editor.iconInvalid"), "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <SettingItem
      label={t("grid.editor.icon")}
      description={t("grid.editor.iconHint")}
    >
      <div className="grid w-full grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          className={`min-w-0 px-2 ${settingsControlClassName}`}
          disabled={busy}
          onClick={() => {
            if (icon) setRefreshOpen(true)
            else void refresh()
          }}
        >
          <ArrowClockwise aria-hidden="true" />
          <span className="truncate">{t("grid.editor.refreshIcon")}</span>
        </Button>
        <Button
          variant="outline"
          render={<label />}
          className={`relative min-w-0 cursor-pointer px-2 ${busy ? "pointer-events-none opacity-50" : ""} ${settingsControlClassName}`}
          aria-disabled={busy}
        >
          <UploadSimple aria-hidden="true" />
          <span className="truncate">
            {t(busy ? "grid.editor.processingIcon" : "grid.editor.uploadIcon")}
          </span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            disabled={busy}
            onChange={(event) => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ""
              void upload(file)
            }}
          />
        </Button>
      </div>
      <AlertDialog
        open={refreshOpen}
        onOpenChange={(open) => {
          if (!busy) setRefreshOpen(open)
        }}
      >
        <AlertDialogContent
          className={alertClassName}
          overlayClassName={alertOverlayClassName}
        >
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("grid.editor.refreshCustomIconTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("grid.editor.refreshCustomIconDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t("grid.editor.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={busy}
              onClick={() => {
                setRefreshOpen(false)
                void refresh()
              }}
            >
              {t("grid.editor.confirmRefreshIcon")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </SettingItem>
  )
}
