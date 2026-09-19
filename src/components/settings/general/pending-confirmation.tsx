import { Button } from "@/components/ui/button"
import { restoreBackup } from "@/lib/backup"
import { storageRevision } from "@/lib/storage"
import { uploadRemoteBackup } from "@/lib/webdav"
import type { Pending } from "./data-settings-types"

export default function PendingConfirmation({
  pending,
  busy,
  setPending,
  setStatus,
  run,
}: {
  pending: Pending | null
  busy: boolean
  setPending: (pending: Pending | null) => void
  setStatus: (status: string) => void
  run: (action: () => Promise<void>) => Promise<void>
}) {
  if (!pending) return null
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-border bg-muted p-3"
    >
      <p className="text-sm">
        {pending.kind === "restore"
          ? pending.remote
            ? "云端数据将替换本地数据，是否继续？"
            : `已校验「${pending.source}」。恢复将覆盖本机数据，建议先导出备份。`
          : "云端已有备份。上传将用本机数据覆盖云端备份。"}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              if (pending.kind === "restore") {
                if ((await storageRevision()) !== pending.revision) {
                  setPending(null)
                  throw new Error("本机数据已变化，请重新选择备份后确认")
                }
                await restoreBackup(pending.backup, pending.revision)
                window.location.reload()
              } else {
                if ((await storageRevision()) !== pending.revision) {
                  setPending(null)
                  throw new Error("本机数据已变化，请重新上传")
                }
                await uploadRemoteBackup(
                  pending.connection,
                  pending.blob,
                  pending.etag,
                  true
                )
                setPending(null)
                setStatus("已上传本机数据，其他设备可下载恢复")
              }
            })
          }
        >
          确认覆盖{pending.kind === "restore" ? "本机" : "云端"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setPending(null)}
        >
          取消
        </Button>
      </div>
    </div>
  )
}
