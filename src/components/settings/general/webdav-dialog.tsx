import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { createBackup, readBackup } from "@/application/backup"
import { storageRevision, writeEntries } from "@/lib/storage"
import { fetchRemoteBackup, uploadRemoteBackup } from "@/application/webdav"
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavDialog({
  state,
  confirmation,
}: {
  state: DataSettingsState
  confirmation: ReactNode
}) {
  const { t } = useTranslation()
  const {
    busy,
    ready,
    webdavOpen,
    setWebdavOpen,
    connection,
    updateConnection,
    setConnection,
    activeConnection,
    setActiveConnection,
    confirmDisconnect,
    setConfirmDisconnect,
    pending,
    setPending,
    status,
    setStatus,
    run,
    connect,
  } = state
  return (
    <Dialog open={webdavOpen} onOpenChange={setWebdavOpen}>
      <DialogContent
        className="max-h-[85svh] overflow-y-auto sm:max-w-md"
        aria-describedby={undefined}
      >
        <div className="grid min-w-0 gap-6 px-2 py-1">
          <DialogTitle>WebDAV</DialogTitle>
          <fieldset
            disabled={busy || !!pending || confirmDisconnect || !ready}
            className="min-w-0 space-y-3"
          >
            <div className="space-y-2">
              <label className="text-xs" htmlFor="webdav-url">
                {t("settings.webdav.url")}
              </label>
              <Input
                id="webdav-url"
                type="url"
                placeholder="https://dav.example.com/oh-my-tab/"
                value={connection.url}
                onChange={(e) => updateConnection({ url: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-xs" htmlFor="webdav-user">
                  {t("settings.webdav.username")}
                </label>
                <Input
                  id="webdav-user"
                  autoComplete="off"
                  value={connection.username}
                  onChange={(e) =>
                    updateConnection({ username: e.target.value })
                  }
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs" htmlFor="webdav-password">
                  {t("settings.webdav.password")}
                </label>
                <Input
                  id="webdav-password"
                  type="password"
                  autoComplete="off"
                  value={connection.password}
                  onChange={(e) =>
                    updateConnection({ password: e.target.value })
                  }
                />
              </div>
            </div>
          </fieldset>
          {status && (
            <p
              role="status"
              className="text-xs leading-5 text-muted-foreground"
            >
              {status}
            </p>
          )}
          {confirmation}
          {confirmDisconnect && (
            <div
              role="alert"
              className="space-y-3 rounded-xl border border-border bg-muted p-3"
            >
              <p className="text-sm leading-6">
                {t("settings.webdav.disconnectNotice")}
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmDisconnect(false)}
                >
                  {t("settings.common.cancel")}
                </Button>
                <Button
                  variant="destructive"
                  disabled={busy}
                  onClick={() =>
                    void run(async () => {
                      await writeEntries({ "omt.webdav": null })
                      setActiveConnection(null)
                      setConnection({
                        url: "",
                        username: "",
                        password: "",
                      })
                      setConfirmDisconnect(false)
                      setStatus("")
                    })
                  }
                >
                  {t("settings.webdav.confirmRemove")}
                </Button>
              </div>
            </div>
          )}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              {activeConnection ? (
                <>
                  <span
                    role="status"
                    className="flex items-center gap-1.5 text-xs text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full bg-emerald-500"
                    />
                    {t("settings.webdav.connected")}
                  </span>
                  <Button
                    variant="outline"
                    disabled={busy || !!pending || confirmDisconnect}
                    onClick={() => setConfirmDisconnect(true)}
                  >
                    {t("settings.webdav.remove")}
                  </Button>
                </>
              ) : (
                <Button
                  variant="outline"
                  disabled={busy || !!pending || !ready}
                  onClick={() =>
                    void run(async () => {
                      await connect()
                    })
                  }
                >
                  {busy
                    ? t("settings.webdav.connecting")
                    : t("settings.webdav.connect")}
                </Button>
              )}
            </div>
            <div className="ml-auto flex gap-2">
              <Button
                variant="outline"
                disabled={
                  !activeConnection || busy || !!pending || confirmDisconnect
                }
                onClick={() =>
                  void run(async () => {
                    const current = activeConnection
                    if (!current)
                      throw new Error(t("settings.webdav.notConnected"))
                    const remote = await fetchRemoteBackup(current)
                    const revision = await storageRevision()
                    const blob = await createBackup()
                    if (remote) {
                      if (!remote.etag || remote.etag.startsWith("W/"))
                        throw new Error(t("settings.webdav.weakEtag"))
                      setPending({
                        kind: "upload",
                        blob,
                        etag: remote.etag,
                        connection: current,
                        revision,
                      })
                    } else {
                      if ((await storageRevision()) !== revision) {
                        setPending(null)
                        throw new Error(t("settings.webdav.dataChanged"))
                      }
                      await uploadRemoteBackup(current, blob, null, false)
                      setStatus(t("settings.webdav.uploaded"))
                    }
                  })
                }
              >
                {t("settings.webdav.upload")}
              </Button>
              <Button
                variant="outline"
                disabled={
                  !activeConnection || busy || !!pending || confirmDisconnect
                }
                onClick={() =>
                  void run(async () => {
                    const revision = await storageRevision()
                    const current = activeConnection
                    if (!current)
                      throw new Error(t("settings.webdav.notConnected"))
                    const remote = await fetchRemoteBackup(current)
                    if (!remote)
                      throw new Error(t("settings.webdav.noRemoteBackup"))
                    setPending({
                      kind: "restore",
                      backup: await readBackup(remote.blob),
                      revision,
                      source: t("settings.webdav.remoteSource"),
                      remote: true,
                    })
                  })
                }
              >
                {t("settings.webdav.download")}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
