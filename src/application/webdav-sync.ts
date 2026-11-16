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
  return prepareSync({
    backend: webdavBackend(current.session),
    store: syncStore,
  })
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
  const backend = await mustBackend()
  return readSyncHistory({ backend, store: syncStore })
}

export async function resetWebdavIndex() {
  const syncStore = store()
  const backend = await mustBackend()
  return resetRemoteIndex({ backend, store: syncStore })
}

async function mustBackend() {
  const current = await store().read()
  if (!current) throw new Error("not connected")
  return webdavBackend(current.session)
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
