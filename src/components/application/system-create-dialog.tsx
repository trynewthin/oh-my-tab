import FolderCreateDialog from "@/components/tab-grid/folder-create-dialog"
import TabCreateDialog from "@/components/tab-grid/tab-create-dialog"

export default function SystemCreateDialog({
  kind,
  onClose,
}: {
  kind: "tab" | "folder"
  onClose: () => void
}) {
  return kind === "tab" ? (
    <TabCreateDialog onClose={onClose} onSaved={onClose} />
  ) : (
    <FolderCreateDialog onClose={onClose} onSaved={onClose} />
  )
}
