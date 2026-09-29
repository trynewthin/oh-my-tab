import { useState } from "react"
import { ArrowsClockwise } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  readWebdavHistory,
  deleteWebdavSnapshot,
  renameWebdavSnapshot,
  type WebdavHistory,
  type WebdavSnapshot,
} from "@/application/webdav-sync"
import { webdavSnapshotName } from "@/lib/webdav-sync"
import { toast } from "@/stores/toast-store"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import WebdavSnapshotList from "./webdav-snapshot-list"
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavSnapshots({
  state,
}: {
  state: DataSettingsState
}) {
  const { t } = useTranslation()
  const {
    saved,
    busy,
    ready,
    pending,
    syncPlan,
    removeOpen,
    run,
    createSnapshot,
  } = state
  const [open, setOpen] = useState(false)
  const [history, setHistory] = useState<WebdavHistory | null>(null)
  const [target, setTarget] = useState<WebdavSnapshot | null>(null)
  const [editing, setEditing] = useState<WebdavSnapshot | null>(null)
  const [name, setName] = useState("")
  const disabled =
    busy || !ready || !saved || !!pending || !!syncPlan || removeOpen
  async function refresh() {
    setHistory(await readWebdavHistory())
  }
  async function removeSnapshot() {
    if (!history || !target) return
    try {
      const result = await deleteWebdavSnapshot(history, target.id)
      setHistory(result.history)
      setTarget(null)
      toast(
        t(
          result.cleanupComplete
            ? "settings.webdav.snapshotDeleted"
            : "settings.webdav.snapshotCleanupFailed"
        ),
        result.cleanupComplete ? "success" : "warning"
      )
    } catch (error) {
      setTarget(null)
      setHistory(null)
      await refresh().catch(() => {})
      throw error
    }
  }
  async function renameSnapshot() {
    if (!history || !editing) return
    try {
      const result = await renameWebdavSnapshot(history, editing.id, name)
      setHistory(result.history)
      setEditing(null)
      if (result.changed)
        toast(
          t(
            result.cleanupComplete
              ? "settings.webdav.snapshotRenamed"
              : "settings.webdav.snapshotRenameCleanupFailed"
          ),
          result.cleanupComplete ? "success" : "warning"
        )
    } catch (error) {
      setEditing(null)
      setHistory(null)
      await refresh().catch(() => {})
      throw error
    }
  }
  return (
    <>
      <SettingItem
        label={t("settings.webdav.snapshots")}
        description={t("settings.webdav.snapshotsHint")}
      >
        <Button
          variant="outline"
          className={settingsControlClassName}
          aria-label={t("settings.webdav.manageSnapshots")}
          disabled={disabled}
          onClick={() => {
            setOpen(true)
            setHistory(null)
            void run(refresh)
          }}
        >
          {t("settings.common.manage")}
        </Button>
      </SettingItem>
      <Dialog
        open={open}
        onOpenChange={(value) => {
          if (!busy) setOpen(value)
        }}
      >
        <DialogContent
          className="max-h-[85svh] overflow-y-auto sm:max-w-lg"
          aria-describedby={undefined}
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() =>
                void run(async () => {
                  await createSnapshot()
                  await refresh()
                })
              }
            >
              <ArrowsClockwise aria-hidden="true" />
              {t("settings.webdav.createSnapshot")}
            </Button>
          }
        >
          <DialogTitle className="pr-36">
            {t("settings.webdav.snapshots")}
          </DialogTitle>
          {history ? (
            <WebdavSnapshotList
              snapshots={history.snapshots}
              busy={busy}
              onDelete={setTarget}
              onRename={(snapshot) => {
                setEditing(snapshot)
                setName(webdavSnapshotName(snapshot))
              }}
            />
          ) : busy ? (
            <p
              role="status"
              className="py-6 text-center text-sm text-muted-foreground"
            >
              {t("settings.webdav.loadingSnapshots")}
            </p>
          ) : (
            <Button
              variant="outline"
              className={settingsControlClassName}
              onClick={() => void run(refresh)}
            >
              {t("settings.webdav.reloadSnapshots")}
            </Button>
          )}
        </DialogContent>
      </Dialog>
      <Dialog
        open={!!editing}
        onOpenChange={(value) => {
          if (!value && !busy) setEditing(null)
        }}
      >
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>{t("settings.webdav.renameSnapshotTitle")}</DialogTitle>
          <SettingItem
            label={t("settings.webdav.snapshotName")}
            htmlFor="webdav-snapshot-name"
            description={t("settings.webdav.snapshotNameHint")}
          >
            <Input
              id="webdav-snapshot-name"
              className={settingsControlClassName}
              maxLength={80}
              value={name}
              disabled={busy}
              onChange={(event) => setName(event.target.value)}
            />
          </SettingItem>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              className={settingsControlClassName}
              disabled={busy}
              onClick={() => setEditing(null)}
            >
              {t("settings.common.cancel")}
            </Button>
            <Button
              disabled={
                busy ||
                !name.trim() ||
                !editing ||
                name.trim() === webdavSnapshotName(editing)
              }
              onClick={() => void run(renameSnapshot)}
            >
              {t("settings.webdav.saveSnapshotName")}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <AlertDialog
        open={!!target}
        onOpenChange={(value) => {
          if (!value && !busy) setTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("settings.webdav.deleteSnapshotTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t("settings.webdav.deleteSnapshotDescription", {
                snapshot: target ? webdavSnapshotName(target) : "",
              })}
              {target && target.id === history?.snapshots[0]?.id && (
                <span className="mt-2 block">
                  {t(
                    history?.snapshots.length === 1
                      ? "settings.webdav.deleteLastSnapshotNotice"
                      : "settings.webdav.deleteLatestSnapshotNotice"
                  )}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t("settings.common.cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busy || !target}
              onClick={() => void run(removeSnapshot)}
            >
              {t("settings.webdav.confirmRemove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
