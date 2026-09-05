import { useState, type FormEvent } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { normalizeTabUrl, type TabEntry } from "./types"

export default function FolderTabEditor({
  folderId,
  tab,
  onClose,
}: {
  folderId: string
  tab: TabEntry
  onClose: () => void
}) {
  const [name, setName] = useState(tab.name)
  const [url, setUrl] = useState(tab.url)
  const [error, setError] = useState("")
  const updateFolderTab = useTabGridStore((state) => state.updateFolderTab)
  function save(event: FormEvent) {
    event.preventDefault()
    const normalized = normalizeTabUrl(url)
    if (!name.trim() || !normalized) {
      setError("请输入名称和有效的 http / https 网址。")
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
          <DialogTitle>编辑标签</DialogTitle>
        </DialogHeader>
        <form className="space-y-4" onSubmit={save}>
          <label className="grid grid-cols-2 items-center gap-3">
            名称
            <Input
              autoFocus
              required
              maxLength={40}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <label className="grid grid-cols-2 items-center gap-3">
            网址
            <Input
              required
              value={url}
              onChange={(event) => setUrl(event.target.value)}
            />
          </label>
          {error && (
            <p role="alert" className="text-xs text-destructive">
              {error}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" type="button" onClick={onClose}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
