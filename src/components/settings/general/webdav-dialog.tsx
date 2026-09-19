import type { ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { createBackup, readBackup } from "@/lib/backup"
import { storageRevision, writeEntries } from "@/lib/storage"
import { fetchRemoteBackup, uploadRemoteBackup } from "@/lib/webdav"
import type { DataSettingsState } from "./use-data-settings"

export default function WebdavDialog({
  state,
  confirmation,
}: {
  state: DataSettingsState
  confirmation: ReactNode
}) {
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
                服务器目录
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
                  用户名
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
                  密码
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
                删除只会关闭连接，不会删除本地数据或云端备份。
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  disabled={busy}
                  onClick={() => setConfirmDisconnect(false)}
                >
                  取消
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
                  确认删除
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
                    已连接
                  </span>
                  <Button
                    variant="outline"
                    disabled={busy || !!pending || confirmDisconnect}
                    onClick={() => setConfirmDisconnect(true)}
                  >
                    删除
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
                  {busy ? "连接中…" : "连接"}
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
                    if (!current) throw new Error("请先连接 WebDAV")
                    const remote = await fetchRemoteBackup(current)
                    const revision = await storageRevision()
                    const blob = await createBackup()
                    if (remote) {
                      if (!remote.etag || remote.etag.startsWith("W/"))
                        throw new Error(
                          "服务器须支持强 ETag 才能安全覆盖云端备份"
                        )
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
                        throw new Error("本机数据已变化，请重新上传")
                      }
                      await uploadRemoteBackup(current, blob, null, false)
                      setStatus("已上传本机数据，其他设备可下载恢复")
                    }
                  })
                }
              >
                上传
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
                    if (!current) throw new Error("请先连接 WebDAV")
                    const remote = await fetchRemoteBackup(current)
                    if (!remote)
                      throw new Error("该目录还没有备份，请先在另一台设备上传")
                    setPending({
                      kind: "restore",
                      backup: await readBackup(remote.blob),
                      revision,
                      source: "WebDAV 云端备份",
                      remote: true,
                    })
                  })
                }
              >
                下载
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
