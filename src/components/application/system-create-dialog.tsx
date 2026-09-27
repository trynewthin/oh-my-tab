import FolderEditor from "@/components/tab-grid/folder-editor"
import TabEditor from "@/components/tab-grid/tab-editor"

export default function SystemCreateDialog({
  kind,
  onClose,
}: {
  kind: "tab" | "folder"
  onClose: () => void
}) {
  return kind === "tab" ? (
    <TabEditor onClose={onClose} onSaved={onClose} />
  ) : (
    <FolderEditor onClose={onClose} onSaved={onClose} />
  )
}
