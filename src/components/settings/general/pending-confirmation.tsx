import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { restoreBackup } from "@/application/backup"
import { storageRevision } from "@/lib/storage"
import type { Pending } from "./data-settings-types"

export default function PendingConfirmation({
  pending,
  busy,
  setPending,
  run,
}: {
  pending: Pending | null
  busy: boolean
  setPending: (pending: Pending | null) => void
  run: (action: () => Promise<void>) => Promise<void>
}) {
  const { t } = useTranslation()
  if (!pending) return null
  return (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-border bg-muted p-3"
    >
      <p className="text-sm">
        {t("settings.pending.restore", { source: pending.source })}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              if ((await storageRevision()) !== pending.revision) {
                setPending(null)
                throw new Error(t("settings.pending.changedRestore"))
              }
              await restoreBackup(pending.backup, pending.revision)
              window.location.reload()
            })
          }
        >
          {t("settings.pending.confirmLocal")}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setPending(null)}
        >
          {t("settings.common.cancel")}
        </Button>
      </div>
    </div>
  )
}
