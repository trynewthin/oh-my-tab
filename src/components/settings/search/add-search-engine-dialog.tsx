import { useTranslation } from "react-i18next"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import SearchEngineForm from "./search-engine-form"
import type { SearchEngine } from "@/lib/search-engines"

type AddSearchEngineDialogProps = {
  engine: SearchEngine
  onClose: () => void
}

export default function AddSearchEngineDialog({
  engine,
  onClose,
}: AddSearchEngineDialogProps) {
  const { t } = useTranslation()
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>{t("settings.searchEngines.addTitle")}</DialogTitle>
        </DialogHeader>
        <SearchEngineForm engine={engine} onClose={onClose} inDialog />
      </DialogContent>
    </Dialog>
  )
}
