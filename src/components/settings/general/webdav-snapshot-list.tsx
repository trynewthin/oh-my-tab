import {
  ArrowCounterClockwise,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { webdavSnapshotName } from "@/lib/webdav-sync"
import { Button } from "@/components/ui/button"
import type { WebdavSnapshot } from "@/application/webdav-sync"

export default function WebdavSnapshotList({
  snapshots,
  busy = false,
  onApply,
  onDelete,
  onRename,
}: {
  snapshots: WebdavSnapshot[]
  busy?: boolean
  onApply?: (snapshot: WebdavSnapshot) => void
  onDelete?: (snapshot: WebdavSnapshot) => void
  onRename?: (snapshot: WebdavSnapshot) => void
}) {
  const { t } = useTranslation()
  if (!snapshots.length)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("settings.webdav.noSnapshots")}
      </p>
    )
  return (
    <ul className="space-y-2" aria-label={t("settings.webdav.snapshots")}>
      {snapshots.map((snapshot, index) => (
        <li
          key={snapshot.id}
          className="rounded-xl border border-border bg-muted p-3"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-medium">
              <span className="break-words">
                {webdavSnapshotName(snapshot)}
              </span>
              {snapshot.protected && (
                <span className="rounded-md border border-border px-1.5 text-xs font-normal text-muted-foreground">
                  {t("settings.webdav.protectedSnapshot")}
                </span>
              )}
              {index === 0 && (
                <span className="rounded-md border border-border px-1.5 text-xs font-normal text-muted-foreground">
                  {t("settings.webdav.latestSnapshot")}
                </span>
              )}
            </div>
            {(onApply || onRename || onDelete) && (
              <div className="flex shrink-0 items-center gap-1">
                {onApply && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                    aria-label={t("settings.webdav.applySnapshot")}
                    disabled={busy}
                    onClick={() => onApply(snapshot)}
                  >
                    <ArrowCounterClockwise aria-hidden="true" />
                  </Button>
                )}
                {onRename && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                    aria-label={t("settings.webdav.renameSnapshot")}
                    disabled={busy}
                    onClick={() => onRename(snapshot)}
                  >
                    <PencilSimple aria-hidden="true" />
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="bg-transparent text-muted-foreground hover:bg-transparent hover:text-foreground dark:hover:bg-transparent"
                    aria-label={t("settings.webdav.remove")}
                    disabled={busy}
                    onClick={() => onDelete(snapshot)}
                  >
                    <Trash aria-hidden="true" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </li>
      ))}
    </ul>
  )
}
