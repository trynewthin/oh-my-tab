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
import { isPresetEngine, type SearchEngine } from "@/lib/search-engines"

type DeleteSearchEngineDialogProps = {
  engine: SearchEngine
  onCancel: () => void
  onConfirm: () => void
}

export default function DeleteSearchEngineDialog({
  engine,
  onCancel,
  onConfirm,
}: DeleteSearchEngineDialogProps) {
  const { t } = useTranslation()
  const preset = isPresetEngine(engine.id)
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open) onCancel()
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {preset
              ? t("settings.searchEngines.removeTitle")
              : t("settings.searchEngines.deleteTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {preset
              ? t("settings.searchEngines.removeBody", { name: engine.name })
              : t("settings.searchEngines.deleteBody", { name: engine.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t("settings.common.cancel")}</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onConfirm}>
            {preset
              ? t("settings.searchEngines.confirmRemove")
              : t("settings.searchEngines.confirmDelete")}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
