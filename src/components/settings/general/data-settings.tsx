import EraseData from "./erase-data"
import LocalBackup from "./local-backup"
import PendingConfirmation from "./pending-confirmation"
import SyncProviderSelect from "./sync-provider"
import WebdavDialog from "./webdav-dialog"
import WebdavRow from "./webdav-row"
import WebdavSnapshots from "./webdav-snapshots"
import WebdavSyncDialog from "./webdav-sync-dialog"
import WebdavRemoveDialog from "./webdav-remove-dialog"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import SettingItem from "../shared/setting-item"
import { settingsControlClassName } from "../shared/control-styles"
import { resetDemoData } from "@/application/demo-data"
import { useDataSettingsState } from "./use-data-settings"

export default function DataSettings() {
  const state = useDataSettingsState()
  const { t } = useTranslation()
  const {
    busy,
    ready,
    syncProvider,
    selectProvider,
    pending,
    syncPlan,
    removeOpen,
  } = state
  const confirmation = (
    <PendingConfirmation
      pending={pending}
      busy={busy}
      setPending={state.setPending}
      run={state.run}
    />
  )
  return (
    <div className="space-y-4">
      {state.migrationIssues > 0 && (
        <SettingItem
          label={t("settings.data.migrationIssues")}
          description={t("settings.data.migrationIssuesHint", {
            count: state.migrationIssues,
          })}
        >
          <Button
            variant="outline"
            className={settingsControlClassName}
            onClick={state.dismissMigrationReport}
          >
            {t("settings.data.dismissReport")}
          </Button>
        </SettingItem>
      )}
      <LocalBackup
        busy={busy || !!syncPlan || removeOpen}
        pending={pending}
        setPending={state.setPending}
        run={state.run}
      />
      <section className="space-y-4" aria-labelledby="sync-settings-title">
        <SyncProviderSelect
          provider={syncProvider}
          busy={busy || !!syncPlan || removeOpen}
          ready={ready}
          pending={pending}
          onSelect={selectProvider}
        />
        {syncProvider === "webdav" && (
          <>
            <WebdavRow state={state} />
            <WebdavSnapshots
              key={`${state.saved?.url ?? ""}:${state.saved?.username ?? ""}:${state.saved?.deviceId ?? ""}`}
              state={state}
            />
          </>
        )}
      </section>
      <WebdavDialog state={state} />
      <WebdavSyncDialog state={state} />
      <WebdavRemoveDialog state={state} />
      {confirmation}
      {import.meta.env.DEV && (
        <SettingItem
          label={t("settings.data.resetMock")}
          description={t("settings.data.resetMockHint")}
        >
          <Button
            variant="outline"
            className={settingsControlClassName}
            onClick={() => resetDemoData()}
          >
            {t("settings.data.resetMock")}
          </Button>
        </SettingItem>
      )}
      <EraseData busy={busy} pending={!!pending || !!syncPlan || removeOpen} />
    </div>
  )
}
