import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import SearchEngineForm from "@/components/settings/search-engine-form"
import type { SearchEngine } from "@/lib/search-engines"

type AddSearchEngineDialogProps = {
  engine: SearchEngine
  onClose: () => void
}

export default function AddSearchEngineDialog({
  engine,
  onClose,
}: AddSearchEngineDialogProps) {
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent showCloseButton={false}>
        <DialogHeader>
          <DialogTitle>添加搜索引擎</DialogTitle>
        </DialogHeader>
        <SearchEngineForm engine={engine} onClose={onClose} inDialog />
      </DialogContent>
    </Dialog>
  )
}
