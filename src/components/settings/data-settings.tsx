import { settingsControlClassName } from "./control-styles"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Info } from "@phosphor-icons/react"
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { toast } from "@/stores/toast-store"
import {
  createBackup,
  readBackup,
  restoreBackup,
  downloadBackup,
  type Backup,
} from "@/lib/backup"
import {
  readEntries,
  writeEntries,
  storageRevision,
  subscribeStorage,
} from "@/lib/storage"
import {
  authorizeWebdav,
  normalizeWebdav,
  testWebdav,
  fetchRemoteBackup,
  uploadRemoteBackup,
  type WebdavConnection,
} from "@/lib/webdav"
import { useEffect } from "react"

type Pending =
  | {
      kind: "restore"
      backup: Backup
      revision: string | undefined
      source: string
      remote?: boolean
    }
  | {
      kind: "upload"
      blob: Blob
      etag: string
      connection: WebdavConnection
      revision: string | undefined
    }

export default function DataSettings() {
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [syncProvider, setSyncProvider] = useState<"local" | "webdav">("local")
  const [webdavOpen, setWebdavOpen] = useState(false)
  const [activeConnection, setActiveConnection] =
    useState<WebdavConnection | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [connection, setConnection] = useState<WebdavConnection>({
    url: "",
    username: "",
    password: "",
  })
  const [ready, setReady] = useState(false)
  const [status, setStatus] = useState("")
  useEffect(() => {
    let active = true
    void readEntries(["omt.webdav", "omt.sync-provider"])
      .then((values) => {
        if (active)
          setSyncProvider(
            values["omt.sync-provider"] === "webdav" ? "webdav" : "local"
          )
        const saved = values["omt.webdav"]
        if (active && typeof saved === "string") {
          const value = JSON.parse(saved)
          setConnection({ ...normalizeWebdav(value), password: "" })
        }
      })
      .catch(() => {
        if (active) setStatus("连接设置读取失败，请重新填写")
      })
      .finally(() => {
        if (active) setReady(true)
      })
    const unsubscribe = subscribeStorage((keys) => {
      if (
        !keys.some((key) => ["omt.webdav", "omt.sync-provider"].includes(key))
      )
        return
      void readEntries(["omt.webdav", "omt.sync-provider"])
        .then((values) => {
          if (active) {
            const provider =
              values["omt.sync-provider"] === "webdav" ? "webdav" : "local"
            setSyncProvider(provider)
            if (provider === "local") {
              setWebdavOpen(false)
              setActiveConnection(null)
              setConfirmDisconnect(false)
              setPending(null)
              setConnection((current) => ({ ...current, password: "" }))
            }
          }
          if (active && values["omt.webdav"] == null) {
            setConnection({ url: "", username: "", password: "" })
            setActiveConnection(null)
            setConfirmDisconnect(false)
            setPending(null)
            setStatus("")
          }
        })
        .catch(() => {})
    })
    return () => {
      active = false
      unsubscribe()
    }
  }, [])
  async function run(action: () => Promise<void>) {
    setBusy(true)
    try {
      await action()
    } catch (error) {
      toast(
        error instanceof Error ? error.message : "操作失败，请重试",
        "error"
      )
    } finally {
      setBusy(false)
    }
  }
  async function connect() {
    const settings = await authorizeWebdav(connection)
    const current = { ...connection, ...settings }
    await testWebdav(current)
    await writeEntries({ "omt.webdav": JSON.stringify(settings) })
    setConnection(current)
    setActiveConnection(current)
    setStatus("")
    return current
  }
  function updateConnection(changes: Partial<WebdavConnection>) {
    setConnection((current) => ({ ...current, ...changes }))
    setActiveConnection(null)
    setConfirmDisconnect(false)
    setStatus("")
  }
  const confirmation = pending && (
    <div
      role="alert"
      className="space-y-3 rounded-xl border border-border bg-muted p-3"
    >
      <p className="text-sm">
        {pending.kind === "restore"
          ? pending.remote
            ? "云端数据将替换本地数据，是否继续？"
            : `已校验「${pending.source}」。恢复将覆盖本机数据，建议先导出备份。`
          : "云端已有备份。上传将用本机数据覆盖云端备份。"}
      </p>
      <div className="flex gap-2">
        <Button
          disabled={busy}
          onClick={() =>
            void run(async () => {
              if (pending.kind === "restore") {
                if ((await storageRevision()) !== pending.revision) {
                  setPending(null)
                  throw new Error("本机数据已变化，请重新选择备份后确认")
                }
                await restoreBackup(pending.backup, pending.revision)
                window.location.reload()
              } else {
                if ((await storageRevision()) !== pending.revision) {
                  setPending(null)
                  throw new Error("本机数据已变化，请重新上传")
                }
                await uploadRemoteBackup(
                  pending.connection,
                  pending.blob,
                  pending.etag,
                  true
                )
                setPending(null)
                setStatus("已上传本机数据，其他设备可下载恢复")
              }
            })
          }
        >
          确认覆盖{pending.kind === "restore" ? "本机" : "云端"}
        </Button>
        <Button
          variant="outline"
          disabled={busy}
          onClick={() => setPending(null)}
        >
          取消
        </Button>
      </div>
    </div>
  )
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <span className="text-sm">备份与恢复</span>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="outline"
              className={settingsControlClassName}
              disabled={busy || !!pending}
              onClick={() =>
                void run(async () => {
                  downloadBackup(await createBackup())
                  toast("ZIP 备份已生成", "success")
                })
              }
            >
              备份
            </Button>
            <Button
              variant="outline"
              className={settingsControlClassName}
              disabled={busy || !!pending}
              onClick={() => input.current?.click()}
            >
              恢复
            </Button>
          </div>
        </div>
        <input
          ref={input}
          type="file"
          accept=".zip,.txt,application/zip,text/plain"
          className="sr-only"
          aria-label="导入数据备份"
          disabled={busy || !!pending}
          onChange={(event) => {
            const file = event.currentTarget.files?.[0]
            event.currentTarget.value = ""
            if (file)
              void run(async () => {
                const revision = await storageRevision()
                setPending({
                  kind: "restore",
                  backup: await readBackup(file),
                  revision,
                  source: file.name,
                })
              })
          }}
        />
      </div>
      <section className="space-y-5" aria-labelledby="sync-settings-title">
        <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
          <label
            id="sync-settings-title"
            htmlFor="sync-provider"
            className="text-sm"
          >
            多端同步
          </label>
          <Select
            value={syncProvider}
            disabled={busy || !!pending || !ready}
            onValueChange={(value) => {
              if (value !== "local" && value !== "webdav") return
              void run(async () => {
                await writeEntries({ "omt.sync-provider": value })
                setSyncProvider(value)
                if (value === "local") {
                  setWebdavOpen(false)
                  setActiveConnection(null)
                  setConfirmDisconnect(false)
                  setConnection((current) => ({ ...current, password: "" }))
                }
              })
            }}
          >
            <SelectTrigger
              id="sync-provider"
              className={`w-full ${settingsControlClassName}`}
            >
              <SelectValue>
                {syncProvider === "webdav" ? "WebDAV" : "关闭"}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="local">关闭</SelectItem>
              <SelectItem value="webdav">WebDAV</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {syncProvider === "webdav" && (
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <div className="flex items-center gap-1">
              <span className="text-sm">WebDAV</span>
              <Popover>
                <PopoverTrigger
                  openOnHover
                  delay={150}
                  closeDelay={100}
                  aria-label="WebDAV 说明与配置"
                  render={
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="rounded-full text-muted-foreground"
                    />
                  }
                >
                  <Info className="size-4" aria-hidden="true" />
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-80 max-w-[calc(100vw-2rem)] gap-3 rounded-xl p-3"
                  aria-label="WebDAV 说明与配置"
                >
                  <PopoverDescription className="text-xs leading-5">
                    WebDAV
                    是一种远程文件存储协议，可将备份保存到你指定的服务器，供多台设备手动同步。
                  </PopoverDescription>
                  <ol className="list-decimal space-y-2 pl-4 text-xs leading-5 text-muted-foreground">
                    <li>
                      准备支持 WebDAV 的服务，创建备份目录，获取 HTTPS
                      目录地址、用户名和密码。
                    </li>
                    <li>点击「管理」，填写上述信息，再点击「连接」。</li>
                    <li>
                      连接成功后点击「上传」保存本机备份；其他设备填写同一目录，连接后点击「下载」并确认恢复。
                    </li>
                  </ol>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              variant="outline"
              className={settingsControlClassName}
              disabled={busy || !!pending}
              onClick={() => setWebdavOpen(true)}
            >
              管理
            </Button>
          </div>
        )}
      </section>
      <Dialog
        open={webdavOpen}
        onOpenChange={(open) => {
          if (busy) return
          setWebdavOpen(open)
          if (!open) {
            setActiveConnection(null)
            setConfirmDisconnect(false)
            setPending(null)
            setConnection((current) => ({ ...current, password: "" }))
            setStatus("")
          }
        }}
      >
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
                        setConnection({ url: "", username: "", password: "" })
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
                        throw new Error(
                          "该目录还没有备份，请先在另一台设备上传"
                        )
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
      {!webdavOpen && confirmation}
    </div>
  )
}
