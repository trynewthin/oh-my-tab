import { ArrowClockwise, TextT, UploadSimple } from "@phosphor-icons/react"
import { useEffect, useState, type ReactNode } from "react"
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
import { encodeTabIcon, readTabIcon } from "@/lib/grid/tab-icon"
import { normalizeTabUrl } from "@/lib/grid/types"
import { toast } from "@/stores/toast-store"
import TabIconCrop from "./tab-icon-crop"
import TabTextIconDialog from "./tab-text-icon-dialog"

const iconActionClassName =
  "group/icon-action w-auto min-w-8 gap-0 px-[7px] motion-reduce:transition-none"

function IconActionLabel({ children }: { children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className="grid grid-cols-[0fr] opacity-0 transition-[grid-template-columns,opacity] duration-200 group-focus-within/icon-action:grid-cols-[1fr] group-focus-within/icon-action:opacity-100 group-hover/icon-action:grid-cols-[1fr] group-hover/icon-action:opacity-100 motion-reduce:transition-none"
    >
      <span className="min-w-0 overflow-hidden">
        <span className="block pl-1.5">{children}</span>
      </span>
    </span>
  )
}

export default function TabIconControls({
  url,
  icon,
  onIconChange,
  alertClassName,
  alertOverlayClassName,
  onDialogOpenChange,
  controlClassName = "",
}: {
  url: string
  icon?: string
  onIconChange: (icon: string | undefined) => void
  alertClassName?: string
  alertOverlayClassName?: string
  onDialogOpenChange?: (open: boolean) => void
  controlClassName?: string
}) {
  const { t } = useTranslation()
  const [busy, setBusy] = useState(false)
  const [refreshOpen, setRefreshOpen] = useState(false)
  const [textIconOpen, setTextIconOpen] = useState(false)
  const [cropImage, setCropImage] = useState<ImageBitmap | null>(null)

  useEffect(() => () => cropImage?.close(), [cropImage])
  useEffect(() => {
    onDialogOpenChange?.(refreshOpen || textIconOpen || cropImage !== null)
  }, [refreshOpen, textIconOpen, cropImage, onDialogOpenChange])

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
      setCropImage(await readTabIcon(file))
    } catch {
      toast(t("grid.editor.iconInvalid"), "error")
    } finally {
      setBusy(false)
    }
  }

  async function confirmCrop(crop: Parameters<typeof encodeTabIcon>[1]) {
    if (!cropImage) return
    setBusy(true)
    try {
      onIconChange(await encodeTabIcon(cropImage, crop))
      setCropImage(null)
    } catch {
      toast(t("grid.editor.iconInvalid"), "error")
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <SettingItem
        label={t("grid.editor.icon")}
        description={t("grid.editor.iconHint")}
      >
        <div className="flex w-full min-w-0 justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("grid.editor.refreshIcon")}
            title={t("grid.editor.refreshIcon")}
            className={`${settingsControlClassName} ${controlClassName} ${iconActionClassName}`}
            disabled={busy}
            onClick={() => {
              if (icon) setRefreshOpen(true)
              else void refresh()
            }}
          >
            <ArrowClockwise aria-hidden="true" />
            <IconActionLabel>{t("grid.editor.refreshIcon")}</IconActionLabel>
          </Button>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("grid.editor.uploadIcon")}
            title={t("grid.editor.uploadIcon")}
            render={<label />}
            className={`relative cursor-pointer ${busy ? "pointer-events-none opacity-50" : ""} ${settingsControlClassName} ${controlClassName} ${iconActionClassName}`}
            aria-disabled={busy}
          >
            <UploadSimple aria-hidden="true" />
            <IconActionLabel>{t("grid.editor.uploadIcon")}</IconActionLabel>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              aria-label={t("grid.editor.uploadIcon")}
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                const file = event.currentTarget.files?.[0]
                event.currentTarget.value = ""
                void upload(file)
              }}
            />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={t("grid.editor.textIcon")}
            title={t("grid.editor.textIcon")}
            className={`${settingsControlClassName} ${controlClassName} ${iconActionClassName}`}
            disabled={busy}
            onClick={() => setTextIconOpen(true)}
          >
            <TextT aria-hidden="true" />
            <IconActionLabel>{t("grid.editor.textIconButton")}</IconActionLabel>
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
      {textIconOpen && (
        <TabTextIconDialog
          contentClassName={alertClassName}
          overlayClassName={alertOverlayClassName}
          onClose={() => setTextIconOpen(false)}
          onConfirm={onIconChange}
        />
      )}
      {cropImage && (
        <TabIconCrop
          image={cropImage}
          busy={busy}
          contentClassName={alertClassName}
          overlayClassName={alertOverlayClassName}
          onClose={() => setCropImage(null)}
          onConfirm={(crop) => void confirmCrop(crop)}
        />
      )}
    </>
  )
}
