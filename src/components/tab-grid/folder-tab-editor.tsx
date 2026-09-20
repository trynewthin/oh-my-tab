import { toast } from "@/stores/toast-store"
import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { normalizeTabUrl, type TabEntry } from "@/lib/grid/types"
import { useTranslation } from "react-i18next"

export default function FolderTabEditor({
  folderId,
  tab,
  onClose,
}: {
  folderId: string
  tab: TabEntry
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [name, setName] = useState(tab.name)
  const [url, setUrl] = useState(tab.url)
  const updateFolderTab = useTabGridStore((state) => state.updateFolderTab)
  function save(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTabUrl(url)
    if (!name.trim() || !normalized) {
      toast(t("grid.folder.invalidTab"), "error")
      return
    }
    updateFolderTab(folderId, tab.id, { name: name.trim(), url: normalized })
    onClose()
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="z-[90]"
        overlayClassName="z-[80]"
      >
        <DialogHeader>
          <DialogTitle>{t("grid.folder.editTabTitle")}</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={save}>
          <label className="grid grid-cols-2 items-center gap-3">
            {t("grid.folder.name")}
            <Input
              autoFocus
              required
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid grid-cols-2 items-center gap-3">
            {t("grid.folder.url")}
            <Input
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              {t("grid.folder.cancel")}
            </Button>
            <Button type="submit">{t("grid.folder.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
