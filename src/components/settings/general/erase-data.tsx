import { useState } from "react"
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
import { Button } from "@/components/ui/button"
import { clearAllData } from "@/lib/storage"
import { toast } from "@/stores/toast-store"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"

export default function EraseData({
  busy,
  pending,
}: {
  busy: boolean
  pending: boolean
}) {
  const { t } = useTranslation()
  const [confirming, setConfirming] = useState(false)
  return (
    <SettingItem label={t("settings.data.erase")}>
      <Button
        variant="destructive"
        className={"w-full " + settingsControlClassName}
        disabled={busy || pending}
        onClick={() => setConfirming(true)}
      >
        {t("settings.data.erase")}
      </Button>
      {confirming && (
        <AlertDialog
          open
          onOpenChange={(open) => {
            if (!open) setConfirming(false)
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t("settings.data.eraseTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t("settings.data.eraseBody")}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>
                {t("settings.common.cancel")}
              </AlertDialogCancel>
              <AlertDialogAction
                variant="destructive"
                onClick={() => {
                  void (async () => {
                    try {
                      await clearAllData()
                      localStorage.clear()
                      window.location.reload()
                    } catch (error) {
                      setConfirming(false)
                      toast(
                        error instanceof Error
                          ? error.message
                          : t("settings.data.actionFailed"),
                        "error"
                      )
                    }
                  })()
                }}
              >
                {t("settings.data.eraseConfirm")}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </SettingItem>
  )
}
