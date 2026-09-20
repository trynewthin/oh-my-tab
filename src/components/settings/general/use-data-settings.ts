import { useEffect, useState } from "react"
import { i18n } from "@/i18n"
import { toast } from "@/stores/toast-store"
import { readEntries, writeEntries, subscribeStorage } from "@/lib/storage"
import {
  authorizeWebdav,
  normalizeWebdav,
  testWebdav,
  type WebdavConnection,
} from "@/application/webdav"
import type { Pending } from "./data-settings-types"

export type SyncProvider = "local" | "webdav"

const emptyConnection: WebdavConnection = {
  url: "",
  username: "",
  password: "",
}

export function useDataSettingsState() {
  const [busy, setBusy] = useState(false)
  const [ready, setReady] = useState(false)
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("local")
  const [webdavOpen, setWebdavOpen] = useState(false)
  const [connection, setConnection] =
    useState<WebdavConnection>(emptyConnection)
  const [activeConnection, setActiveConnection] =
    useState<WebdavConnection | null>(null)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)
  const [pending, setPending] = useState<Pending | null>(null)
  const [status, setStatus] = useState("")

  function resetRemoteState() {
    setActiveConnection(null)
    setConfirmDisconnect(false)
    setPending(null)
    setConnection((current) => ({ ...current, password: "" }))
  }

  function resetConnection() {
    setConnection(emptyConnection)
    setActiveConnection(null)
    setConfirmDisconnect(false)
    setPending(null)
    setStatus("")
  }

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
        if (active) setStatus(i18n.t("settings.data.loadFailed"))
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
              resetRemoteState()
            }
          }
          if (active && values["omt.webdav"] == null) {
            resetConnection()
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
        error instanceof Error
          ? error.message
          : i18n.t("settings.data.actionFailed"),
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

  async function selectProvider(provider: SyncProvider) {
    await writeEntries({ "omt.sync-provider": provider })
    setSyncProvider(provider)
    if (provider === "local") {
      setWebdavOpen(false)
      resetRemoteState()
    }
  }

  function updateConnection(changes: Partial<WebdavConnection>) {
    setConnection((current) => ({ ...current, ...changes }))
    setActiveConnection(null)
    setConfirmDisconnect(false)
    setStatus("")
  }

  function changeWebdavOpen(open: boolean) {
    if (busy) return
    setWebdavOpen(open)
    if (!open) {
      resetRemoteState()
      setStatus("")
    }
  }

  return {
    busy,
    ready,
    syncProvider,
    selectProvider,
    webdavOpen,
    setWebdavOpen: changeWebdavOpen,
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
  }
}

export type DataSettingsState = ReturnType<typeof useDataSettingsState>
