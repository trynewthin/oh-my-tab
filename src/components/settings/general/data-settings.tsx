import EraseData from "./erase-data"
import LocalBackup from "./local-backup"
import PendingConfirmation from "./pending-confirmation"
import SyncProviderSelect from "./sync-provider"
import WebdavDialog from "./webdav-dialog"
import WebdavRow from "./webdav-row"
import WebdavSnapshots from "./webdav-snapshots"
import WebdavSyncDialog from "./webdav-sync-dialog"
import WebdavRemoveDialog from "./webdav-remove-dialog"
import { useDataSettingsState } from "./use-data-settings"

export default function DataSettings() {
  const state = useDataSettingsState()
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
      <EraseData busy={busy} pending={!!pending || !!syncPlan || removeOpen} />
    </div>
  )
}
