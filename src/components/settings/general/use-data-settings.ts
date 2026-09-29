import { useEffect, useRef, useState } from "react"
import { i18n } from "@/i18n"
import { toast } from "@/stores/toast-store"
import { readEntries, writeEntries, subscribeStorage } from "@/lib/storage"
import {
  authorizeWebdav,
  testWebdav,
  type WebdavConnection,
} from "@/application/webdav"
import {
  parseWebdavSettings,
  saveWebdavSettings,
  removeWebdavSettings,
  type SavedWebdav,
} from "@/application/webdav-settings"
import {
  prepareWebdavSync,
  executeWebdavSync,
  createWebdavSnapshot,
  type WebdavSyncPlan,
} from "@/application/webdav-sync"
import { DEFAULT_SNAPSHOT_LIMIT, type SyncDirection } from "@/lib/webdav-sync"
import type { Pending } from "./data-settings-types"

export type SyncProvider = "local" | "webdav"
const emptyConnection: WebdavConnection = {
  url: "",
  username: "",
  password: "",
}

export function useDataSettingsState() {
  const [busy, setBusy] = useState(false)
  const running = useRef(false)
  const checkVersion = useRef(0)
  const [ready, setReady] = useState(false)
  const [syncProvider, setSyncProvider] = useState<SyncProvider>("local")
  const [webdavOpen, setWebdavOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [connection, setConnection] =
    useState<WebdavConnection>(emptyConnection)
  const [saved, setSaved] = useState<SavedWebdav | null>(null)
  const [connected, setConnected] = useState(false)
  const [snapshotLimit, setSnapshotLimit] = useState(DEFAULT_SNAPSHOT_LIMIT)
  const [pending, setPending] = useState<Pending | null>(null)
  const [syncPlan, setSyncPlan] = useState<WebdavSyncPlan | null>(null)

  useEffect(() => {
    let active = true
    let loadVersion = 0
    async function load() {
      const version = ++loadVersion
      const check = ++checkVersion.current
      try {
        const values = await readEntries(["omt.webdav", "omt.sync-provider"])
        if (!active || version !== loadVersion) return
        const parsed = parseWebdavSettings(values["omt.webdav"])
        const provider =
          values["omt.sync-provider"] === "webdav" ? "webdav" : "local"
        setSyncProvider(provider)
        setConnection(parsed?.connection ?? emptyConnection)
        setSaved(parsed?.saved ?? null)
        setSnapshotLimit(parsed?.saved?.snapshotLimit ?? DEFAULT_SNAPSHOT_LIMIT)
        setConnected(false)
        setSyncPlan(null)
        setRemoveOpen(false)
        if (provider === "local") setWebdavOpen(false)
        setReady(true)
        if (parsed?.saved && provider === "webdav") {
          try {
            await testWebdav(parsed.saved)
            if (active && check === checkVersion.current) setConnected(true)
          } catch {
            if (active && check === checkVersion.current) setConnected(false)
          }
        }
      } catch {
        if (active && version === loadVersion)
          toast(i18n.t("settings.data.loadFailed"), "error")
      } finally {
        if (active && version === loadVersion) setReady(true)
      }
    }
    void load()
    const unsubscribe = subscribeStorage((keys) => {
      if (keys.some((key) => ["omt.webdav", "omt.sync-provider"].includes(key)))
        void load()
    })
    const offline = () => {
      ++checkVersion.current
      setConnected(false)
    }
    window.addEventListener("offline", offline)
    return () => {
      active = false
      unsubscribe()
      window.removeEventListener("offline", offline)
    }
  }, [])

  async function run(action: () => Promise<void>) {
    if (running.current) return
    running.current = true
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
      running.current = false
      setBusy(false)
    }
  }
  async function connect() {
    ++checkVersion.current
    try {
      const normalized = await authorizeWebdav(connection)
      const result = await saveWebdavSettings(
        { ...connection, ...normalized },
        snapshotLimit
      )
      setSaved(result)
      setConnection(result)
      setConnected(true)
      setWebdavOpen(false)
    } catch (error) {
      setConnected(false)
      throw error
    }
  }
  async function remove() {
    if (!removeOpen || !saved) return
    ++checkVersion.current
    await removeWebdavSettings()
    setRemoveOpen(false)
    setSaved(null)
    setConnection(emptyConnection)
    setConnected(false)
    setSyncPlan(null)
    setSnapshotLimit(DEFAULT_SNAPSHOT_LIMIT)
  }
  async function finishSync(
    plan: WebdavSyncPlan,
    direction: Exclude<SyncDirection, "choose">,
    snapshotId?: string
  ) {
    try {
      const result = await executeWebdavSync(plan, direction, { snapshotId })
      setSaved(result.saved)
      setSyncPlan(null)
      if (result.restored) {
        window.location.reload()
        return
      }
      toast(
        i18n.t(
          result.cleanupComplete
            ? result.duplicate
              ? "settings.webdav.snapshotExists"
              : "settings.webdav.synced"
            : "settings.webdav.cleanupFailed"
        ),
        result.cleanupComplete ? "success" : "warning"
      )
    } catch (error) {
      setSyncPlan(null)
      throw error
    }
  }
  async function sync() {
    if (!saved) return
    ++checkVersion.current
    try {
      await testWebdav(saved)
      setConnected(true)
    } catch (error) {
      setConnected(false)
      throw error
    }
    const plan = await prepareWebdavSync()
    if (plan.direction === "choose") setSyncPlan(plan)
    else await finishSync(plan, plan.direction)
  }
  async function createSnapshot() {
    if (!saved) return
    ++checkVersion.current
    try {
      await testWebdav(saved)
      setConnected(true)
    } catch (error) {
      setConnected(false)
      throw error
    }
    const result = await createWebdavSnapshot()
    setSaved(result.saved)
    toast(
      i18n.t(
        result.cleanupComplete
          ? "settings.webdav.snapshotCreated"
          : "settings.webdav.cleanupFailed"
      ),
      result.cleanupComplete ? "success" : "warning"
    )
  }
  async function selectProvider(provider: SyncProvider) {
    await run(async () => {
      await writeEntries({ "omt.sync-provider": provider })
      setSyncProvider(provider)
      setWebdavOpen(false)
      setSyncPlan(null)
      if (provider === "webdav" && saved) {
        ++checkVersion.current
        try {
          await testWebdav(saved)
          setConnected(true)
        } catch {
          setConnected(false)
        }
      }
    })
  }
  function changeWebdavOpen(open: boolean) {
    if (busy) return
    if (open && saved) {
      setConnection(saved)
      setSnapshotLimit(saved.snapshotLimit)
    }
    setWebdavOpen(open)
  }
  function updateConnection(changes: Partial<WebdavConnection>) {
    setConnection((current) => ({ ...current, ...changes }))
  }
  return {
    busy,
    ready,
    syncProvider,
    selectProvider,
    webdavOpen,
    removeOpen,
    setRemoveOpen,
    setWebdavOpen: changeWebdavOpen,
    connection,
    updateConnection,
    saved,
    connected,
    snapshotLimit,
    setSnapshotLimit,
    pending,
    setPending,
    syncPlan,
    setSyncPlan,
    run,
    connect,
    remove,
    sync,
    createSnapshot,
    finishSync,
  }
}
export type DataSettingsState = ReturnType<typeof useDataSettingsState>
