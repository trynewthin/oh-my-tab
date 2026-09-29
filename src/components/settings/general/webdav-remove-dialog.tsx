import { useTranslation } from "react-i18next"
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
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavRemoveDialog({
  state,
}: {
  state: DataSettingsState
}) {
  const { t } = useTranslation()
  const { busy, saved, removeOpen, setRemoveOpen, run, remove } = state
  return (
    <AlertDialog
      open={removeOpen}
      onOpenChange={(open) => {
        if (!busy) setRemoveOpen(open)
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t("settings.webdav.removeTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("settings.webdav.disconnectNotice")}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t("settings.common.cancel")}
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy || !saved}
            onClick={() => void run(remove)}
          >
            {t("settings.webdav.confirmRemove")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
