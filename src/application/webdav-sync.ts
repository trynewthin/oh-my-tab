import { webdavBackend } from "@/application/backends/webdav"
import {
  readWebdavSettings,
  WEBDAV_KEY,
  type SavedWebdav,
} from "@/application/webdav-settings"
import {
  applySnapshot,
  deleteSnapshot,
  executeSync,
  prepareSync,
  readSyncHistory,
  renameSnapshot,
  resetRemoteIndex,
  type SyncHistory,
  type SyncPlan,
  type SyncStore,
} from "@/application/sync/engine"
import { i18n } from "@/i18n"
import { writeEntries } from "@/lib/storage"
import type { SyncDirection } from "@/lib/webdav-sync"

export {
  parseRemoteIndex,
  uniqueSnapshots as uniqueWebdavSnapshots,
  syncPlanSnapshots,
  type MarkedSnapshot,
  type WebdavSnapshot,
} from "@/application/sync/engine"

export type WebdavSyncPlan = SyncPlan<SavedWebdav>
export type WebdavHistory = SyncHistory<SavedWebdav>

function store(): SyncStore<SavedWebdav> {
  return {
    read: async () => {
      const { saved, raw } = await readWebdavSettings()
      return saved && typeof raw === "string" ? { session: saved, raw } : null
    },
    write: (session, expectedRaw) =>
      writeEntries({ [WEBDAV_KEY]: JSON.stringify(session) }, true, {
        [WEBDAV_KEY]: expectedRaw,
      }),
  }
}

export async function prepareWebdavSync(): Promise<WebdavSyncPlan> {
  const syncStore = store()
  const current = await syncStore.read()
  if (!current) throw new Error(i18n.t("settings.webdav.notConnected"))
  const plan = await prepareSync({
    backend: webdavBackend(current.session),
    store: syncStore,
  })
  // The backend was built from `current`; if the settings changed in
  // another tab before the engine read them, the plan pairs this backend
  // with a different server — refuse instead of syncing the wrong host.
  if (plan.raw !== current.raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  return plan
}

export async function executeWebdavSync(
  plan: WebdavSyncPlan,
  direction: Exclude<SyncDirection, "choose">,
  options: { forceSnapshot?: boolean; snapshotId?: string } = {}
) {
  const result = await executeSync(plan, direction, options)
  return { ...result, saved: result.session }
}

export async function createWebdavSnapshot() {
  const plan = await prepareWebdavSync()
  const result = await executeSync(plan, "upload", { forceSnapshot: true })
  return { ...result, saved: result.session }
}

export async function readWebdavHistory(): Promise<WebdavHistory> {
  const syncStore = store()
  const { backend, raw } = await mustBackend()
  const history = await readSyncHistory({ backend, store: syncStore })
  // The backend was built from `raw`; a different live session would pair
  // this backend with another server's history.
  if (history.raw !== raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  return history
}

export async function resetWebdavIndex() {
  const syncStore = store()
  const { backend, raw } = await mustBackend()
  return resetRemoteIndex({ backend, store: syncStore, expectedRaw: raw })
}

async function mustBackend() {
  const current = await store().read()
  if (!current) throw new Error("not connected")
  return { backend: webdavBackend(current.session), raw: current.raw }
}

export function renameWebdavSnapshot(
  history: WebdavHistory,
  snapshotId: string,
  value: string
) {
  return renameSnapshot(history, snapshotId, value)
}

export async function applyWebdavSnapshot(
  history: WebdavHistory,
  snapshotId: string
) {
  const result = await applySnapshot(history, snapshotId)
  return { saved: result.session }
}

export function deleteWebdavSnapshot(
  history: WebdavHistory,
  snapshotId: string
) {
  return deleteSnapshot(history, snapshotId)
}
