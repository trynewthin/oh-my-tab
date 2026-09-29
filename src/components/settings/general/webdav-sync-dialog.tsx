import { useState } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { syncPlanSnapshots } from "@/application/webdav-sync"
import SettingItem from "../shared/setting-item"
import WebdavSnapshotList from "./webdav-snapshot-list"
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavSyncDialog({
  state,
}: {
  state: DataSettingsState
}) {
  const { t } = useTranslation()
  const { syncPlan: plan, busy, setSyncPlan, run, finishSync } = state
  const snapshots = plan ? syncPlanSnapshots(plan) : []
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected =
    snapshots.find((snapshot) => snapshot.id === selectedId) ?? snapshots[0]
  return (
    <Dialog
      open={!!plan}
      onOpenChange={(open) => {
        if (!open && !busy) setSyncPlan(null)
      }}
    >
      <DialogContent
        className="max-h-[85svh] overflow-y-auto sm:max-w-lg"
        aria-describedby={undefined}
      >
        <DialogTitle>{t("settings.webdav.chooseVersion")}</DialogTitle>
        {plan && (
          <div className="space-y-4">
            <SettingItem
              label={t("settings.webdav.snapshots")}
              description={t("settings.webdav.chooseDescription")}
            >
              <span className="text-right text-sm text-muted-foreground">
                {t("settings.webdav.snapshotCount", {
                  count: syncPlanSnapshots(plan).length,
                })}
              </span>
            </SettingItem>
            <WebdavSnapshotList
              snapshots={snapshots}
              busy={busy}
              selectedId={selected?.id}
              onSelect={(snapshot) => setSelectedId(snapshot.id)}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => setSyncPlan(null)}
              >
                {t("settings.common.cancel")}
              </Button>
              <Button
                variant="outline"
                disabled={busy}
                onClick={() => void run(() => finishSync(plan, "upload"))}
              >
                {t("settings.webdav.useLocal")}
              </Button>
              <Button
                disabled={busy || !selected}
                onClick={() =>
                  void run(() => finishSync(plan, "download", selected?.id))
                }
              >
                {t("settings.webdav.useRemote")}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
