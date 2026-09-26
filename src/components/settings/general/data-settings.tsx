import EraseData from "./erase-data"
import LocalBackup from "./local-backup"
import PendingConfirmation from "./pending-confirmation"
import SyncProviderSelect from "./sync-provider"
import WebdavDialog from "./webdav-dialog"
import WebdavRow from "./webdav-row"
import { useDataSettingsState } from "./use-data-settings"

export default function DataSettings() {
  const state = useDataSettingsState()
  const { busy, ready, syncProvider, selectProvider, webdavOpen, pending } =
    state
  const confirmation = (
    <PendingConfirmation
      pending={pending}
      busy={busy}
      setPending={state.setPending}
      setStatus={state.setStatus}
      run={state.run}
    />
  )
  return (
    <div className="space-y-4">
      <LocalBackup
        busy={busy}
        pending={pending}
        setPending={state.setPending}
        run={state.run}
      />
      <section className="space-y-4" aria-labelledby="sync-settings-title">
        <SyncProviderSelect
          provider={syncProvider}
          busy={busy}
          ready={ready}
          pending={pending}
          onSelect={selectProvider}
        />
        {syncProvider === "webdav" && (
          <WebdavRow
            disabled={busy || !!pending}
            onManage={() => state.setWebdavOpen(true)}
          />
        )}
      </section>
      <WebdavDialog state={state} confirmation={confirmation} />
      {!webdavOpen && confirmation}
      <EraseData busy={busy} pending={!!pending} />
    </div>
  )
}
