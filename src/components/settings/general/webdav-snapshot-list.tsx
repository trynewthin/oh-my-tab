import {
  ArrowCounterClockwise,
  Check,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react"
import { cn } from "@/lib/utils"
import { useTranslation } from "react-i18next"
import { webdavSnapshotName } from "@/lib/webdav-sync"
import { Button } from "@/components/ui/button"
import type { MarkedSnapshot } from "@/application/webdav-sync"

export default function WebdavSnapshotList({
  snapshots,
  busy = false,
  onApply,
  onDelete,
  onRename,
  selectedId,
  onSelect,
}: {
  snapshots: MarkedSnapshot[]
  busy?: boolean
  onApply?: (snapshot: MarkedSnapshot) => void
  onDelete?: (snapshot: MarkedSnapshot) => void
  onRename?: (snapshot: MarkedSnapshot) => void
  selectedId?: string
  onSelect?: (snapshot: MarkedSnapshot) => void
}) {
  const { t } = useTranslation()
  if (!snapshots.length)
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        {t("settings.webdav.noSnapshots")}
      </p>
    )
  return (
    <ul
      className="space-y-2"
      aria-label={t("settings.webdav.snapshots")}
      role={onSelect ? "radiogroup" : undefined}
    >
      {snapshots.map((snapshot, index) => {
        const selected = snapshot.id === selectedId
        const content = (
          <>
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm font-medium">
              <span className="break-words">
                {webdavSnapshotName(snapshot)}
              </span>
              {snapshot.protected && (
                <span className="rounded-md border border-border px-1.5 text-xs font-normal text-muted-foreground">
                  {t("settings.webdav.protectedSnapshot")}
                </span>
              )}
              {snapshot.state === "legacy" && (
                <span className="rounded-md border border-border px-1.5 text-xs font-normal text-muted-foreground">
                  {t("settings.webdav.legacySnapshot")}
                </span>
              )}
              {snapshot.state === "corrupt" && (
                <span className="rounded-md border border-destructive px-1.5 text-xs font-normal text-destructive">
                  {t("settings.webdav.corruptSnapshot")}
                </span>
              )}
              {index === 0 && (
                <span className="rounded-md border border-border px-1.5 text-xs font-normal text-muted-foreground">
                  {t("settings.webdav.latestSnapshot")}
                </span>
              )}
            </div>
            {onSelect && (
              <span
                className={cn(
                  "flex size-5 shrink-0 items-center justify-center rounded-full border",
                  selected
                    ? "border-foreground bg-foreground text-background"
                    : "border-muted-foreground text-transparent"
                )}
              >
                <Check weight="bold" aria-hidden="true" />
              </span>
            )}
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
          </>
        )
        return (
          <li
            key={snapshot.id}
            className={cn(
              "rounded-xl border bg-muted",
              selected ? "border-foreground/60" : "border-border",
              !onSelect && "p-3"
            )}
          >
            {onSelect ? (
              <button
                type="button"
                role="radio"
                aria-checked={selected}
                disabled={busy}
                className="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left disabled:cursor-not-allowed disabled:opacity-50"
                onClick={() => onSelect(snapshot)}
              >
                {content}
              </button>
            ) : (
              <div className="flex items-center justify-between gap-3">
                {content}
              </div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
