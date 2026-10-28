import { CONFIG_VERSION } from "@/lib/data-version"
import { migrateRemoteHistory } from "@/lib/migrations/webdav-history"
import {
  parseRemoteIndex,
  type RemoteIndex,
  type WebdavSnapshot,
} from "@/lib/webdav-history"
export { parseRemoteIndex, type WebdavSnapshot } from "@/lib/webdav-history"
import { encodeBackup } from "@/lib/backup-codec"
import { i18n } from "@/i18n"
import {
  createBackup,
  readBackup,
  readBackupContents,
  restoreBackup,
  type Backup,
} from "./backup"
import {
  fetchRemoteBackup,
  requestWebdav,
  checkWebdavResponse,
  type WebdavConnection,
} from "./webdav"
import {
  readWebdavSettings,
  WEBDAV_KEY,
  type SavedWebdav,
} from "./webdav-settings"
import { readEntries, storageRevision, writeEntries } from "@/lib/storage"
import {
  compareBackupContent,
  contentHash,
  syncDirection,
  stableJson,
  defaultWebdavSnapshotName,
  validWebdavSnapshotName,
  webdavSnapshotName,
  type ChangeSummary,
  type SyncDirection,
} from "@/lib/webdav-sync"

const INDEX_FILE = "oh-my-tab-sync.json"
const MAX_INDEX_BYTES = 4 * 1024 * 1024
const MAX_SNAPSHOTS = 10000
type RemoteState = {
  index: RemoteIndex | null
  indexEtag: string | null
  backup: Backup | null
  hash?: string
  id?: string
  deviceId?: string
  uploadedAt?: number | null
  modifiedAt?: number | null
  large: boolean
  change: ChangeSummary | null
}
export type WebdavSyncPlan = {
  saved: SavedWebdav
  raw: string
  revision: string | undefined
  localBlob: Blob
  localHash: string
  localBackup: Backup
  remote: RemoteState
  direction: SyncDirection
}
function invalidIndex(): never {
  throw new Error(i18n.t("settings.webdav.invalidHistory"))
}
async function readIndexedSnapshot(
  connection: WebdavConnection,
  snapshot: WebdavSnapshot
) {
  const file = await fetchRemoteBackup(connection, snapshot.file)
  if (!file) invalidIndex()
  const contents = await readBackupContents(file.blob)
  if (
    (contents.sourceConfig as { version?: unknown } | null)?.version !==
    CONFIG_VERSION
  )
    invalidIndex()
  const sourceHash = await contentHash(
    contents.sourceConfig,
    contents.backup.image
  )
  if (sourceHash !== snapshot.hash) invalidIndex()
  return {
    backup: contents.backup,
    hash: await contentHash(contents.backup.config, contents.backup.image),
  }
}
async function readCurrentIndex(connection: SavedWebdav) {
  return migrateRemoteHistory({
    snapshotLimit: connection.snapshotLimit,
    fetch: (file, maxBytes) => fetchRemoteBackup(connection, file, maxBytes),
    convert: async (blob) => {
      const contents = await readBackupContents(blob)
      const sourceHash = await contentHash(
        contents.sourceConfig,
        contents.backup.image
      )
      const hash = await contentHash(
        contents.backup.config,
        contents.backup.image
      )
      return {
        blob:
          sourceHash === hash
            ? blob
            : await encodeBackup(contents.backup.config, contents.backup.image),
        sourceHash,
        hash,
      }
    },
    putSnapshot: async (file, body) => {
      const response = await requestWebdav(connection, "PUT", {
        file,
        body,
        headers: { "Content-Type": "application/zip", "If-None-Match": "*" },
      })
      checkWebdavResponse(response)
      await response.body?.cancel()
    },
    cleanup: (index) => cleanHistory(connection, index),
    putIndex: (index, etag, exists) =>
      putIndex(connection, index, etag, exists),
    removeSource: async (file, etag) => {
      const response = await requestWebdav(connection, "DELETE", {
        file,
        headers: condition(etag, true),
      })
      if (response.status !== 404) checkWebdavResponse(response)
      await response.body?.cancel()
    },
  })
}
async function remoteState(connection: SavedWebdav): Promise<RemoteState> {
  const indexFile = await readCurrentIndex(connection)
  if (!indexFile)
    return {
      index: null,
      indexEtag: null,
      backup: null,
      large: false,
      change: null,
    }
  const index = parseRemoteIndex(await indexFile.blob.text())
  const latest = index.snapshots[0]
  if (!latest)
    return {
      index,
      indexEtag: indexFile.etag,
      backup: null,
      large: false,
      change: null,
    }
  const contents = await readIndexedSnapshot(connection, latest)
  return {
    index,
    indexEtag: indexFile.etag,
    ...contents,
    id: latest.id,
    deviceId: latest.deviceId,
    uploadedAt: latest.uploadedAt,
    large: latest.change?.large ?? true,
    change: latest.change,
  }
}
export async function prepareWebdavSync(): Promise<WebdavSyncPlan> {
  const { saved, raw } = await readWebdavSettings()
  if (!saved || typeof raw !== "string")
    throw new Error(i18n.t("settings.webdav.notConnected"))
  const revision = await storageRevision()
  const localBlob = await createBackup()
  const localBackup = await readBackup(localBlob)
  const localHash = await contentHash(localBackup.config, localBackup.image)
  const remote = await remoteState(saved)
  const direction = syncDirection({
    localHash,
    remoteHash: remote.hash,
    remoteId: remote.id,
    remoteDevice: remote.deviceId,
    deviceId: saved.deviceId,
    baseline: saved.baseline,
    large: remote.large,
  })
  const plan = {
    saved,
    raw,
    revision,
    localBlob,
    localHash,
    localBackup,
    remote,
    direction,
  }
  await assertCurrent(plan)
  return plan
}
async function assertCurrent(plan: WebdavSyncPlan) {
  if ((await storageRevision()) !== plan.revision)
    throw new Error(i18n.t("settings.webdav.dataChanged"))
  if ((await readEntries([WEBDAV_KEY]))[WEBDAV_KEY] !== plan.raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
}
function condition(
  etag: string | null,
  exists: boolean
): Record<string, string> {
  if (exists && (!etag || etag.startsWith("W/")))
    throw new Error(i18n.t("settings.webdav.weakEtagServer"))
  return exists ? { "If-Match": etag! } : { "If-None-Match": "*" }
}
async function putIndex(
  connection: WebdavConnection,
  index: RemoteIndex,
  etag: string | null,
  exists: boolean
) {
  const body = new Blob([JSON.stringify(index)], { type: "application/json" })
  if (index.snapshots.length > MAX_SNAPSHOTS || body.size > MAX_INDEX_BYTES)
    throw new Error(i18n.t("settings.webdav.historyFull"))
  const response = await requestWebdav(connection, "PUT", {
    file: INDEX_FILE,
    headers: { "Content-Type": "application/json", ...condition(etag, exists) },
    body,
  })
  checkWebdavResponse(response)
  await response.body?.cancel()
}
async function cleanHistory(
  connection: WebdavConnection,
  index: RemoteIndex
): Promise<boolean> {
  if (!index.garbage.length) return true
  const failed: string[] = []
  for (const file of index.garbage) {
    try {
      const response = await requestWebdav(connection, "DELETE", { file })
      if (response.status !== 404) checkWebdavResponse(response)
      await response.body?.cancel()
    } catch {
      failed.push(file)
    }
  }
  // Clear garbage only if the index is unchanged; never overwrite another
  // upload.
  try {
    const current = await fetchRemoteBackup(
      connection,
      INDEX_FILE,
      MAX_INDEX_BYTES
    )
    if (current) {
      const latest = parseRemoteIndex(await current.blob.text())
      if (stableJson(latest) === stableJson(index))
        await putIndex(
          connection,
          { ...latest, garbage: failed },
          current.etag,
          true
        )
    }
  } catch {
    return false
  }
  return failed.length === 0
}
export function uniqueWebdavSnapshots(snapshots: WebdavSnapshot[]) {
  const hashes = new Map<string, WebdavSnapshot>()
  for (const snapshot of snapshots) {
    if (snapshot.manual) continue
    const previous = hashes.get(snapshot.hash)
    if (!previous || (!previous.protected && snapshot.protected))
      hashes.set(snapshot.hash, snapshot)
  }
  const ordinaryIds = new Set([...hashes.values()].map(({ id }) => id))
  return snapshots.filter(
    (snapshot) => snapshot.manual || ordinaryIds.has(snapshot.id)
  )
}
function retainedIndex(
  index: RemoteIndex,
  snapshots: WebdavSnapshot[],
  snapshotLimit = index.snapshotLimit
): RemoteIndex {
  let automaticCount = 0
  const retained = uniqueWebdavSnapshots(snapshots).filter(
    (snapshot) => snapshot.protected || ++automaticCount <= snapshotLimit
  )
  const files = new Set(retained.map((snapshot) => snapshot.file))
  return {
    ...index,
    version: 4,
    snapshotLimit,
    snapshots: retained,
    garbage: [
      ...new Set([
        ...index.garbage,
        ...snapshots
          .filter((snapshot) => !files.has(snapshot.file))
          .map((snapshot) => snapshot.file),
      ]),
    ],
  }
}
async function settleHistory(
  connection: WebdavConnection,
  index: RemoteIndex,
  etag: string | null
) {
  const unique = retainedIndex(index, index.snapshots)
  if (stableJson(unique) !== stableJson(index))
    await putIndex(connection, unique, etag, true)
  return {
    index: unique,
    cleanupComplete: await cleanHistory(connection, unique),
  }
}
export type WebdavHistory = {
  saved: SavedWebdav
  raw: string
  index: RemoteIndex | null
  etag: string | null
  snapshots: WebdavSnapshot[]
}
export async function readWebdavHistory(): Promise<WebdavHistory> {
  const { saved, raw } = await readWebdavSettings()
  if (!saved || typeof raw !== "string")
    throw new Error(i18n.t("settings.webdav.notConnected"))
  const file = await readCurrentIndex(saved)
  const index = file ? parseRemoteIndex(await file.blob.text()) : null
  const snapshots = index ? uniqueWebdavSnapshots(index.snapshots) : []
  if ((await readEntries([WEBDAV_KEY]))[WEBDAV_KEY] !== raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  return { saved, raw, index, etag: file?.etag ?? null, snapshots }
}
async function currentHistory(history: WebdavHistory) {
  const current = await readWebdavHistory()
  if (current.raw !== history.raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  if (
    current.etag !== history.etag ||
    stableJson(current.snapshots) !== stableJson(history.snapshots)
  )
    throw new Error(i18n.t("settings.webdav.conflict"))
  return current
}
export async function renameWebdavSnapshot(
  history: WebdavHistory,
  snapshotId: string,
  value: string
) {
  const name = value.trim()
  if (!validWebdavSnapshotName(name))
    throw new Error(i18n.t("settings.webdav.invalidSnapshotName"))
  return navigator.locks.request("omt-webdav", async () => {
    const current = await currentHistory(history)
    const target = current.snapshots.find(
      (snapshot) => snapshot.id === snapshotId
    )
    if (!target) throw new Error(i18n.t("settings.webdav.conflict"))
    if (name === webdavSnapshotName(target))
      return { history: current, changed: false, cleanupComplete: true }
    if (!current.index) throw new Error(i18n.t("settings.webdav.conflict"))
    // Use the deduplicated view so one content version cannot gain several
    // protected copies.
    const snapshots = current.snapshots.map((snapshot) =>
      snapshot.id === snapshotId
        ? { ...snapshot, name, protected: true }
        : snapshot
    )
    const files = new Set(snapshots.map((snapshot) => snapshot.file))
    const index = retainedIndex(
      {
        ...current.index,
        garbage: [
          ...current.index.garbage,
          ...current.index.snapshots
            .filter((snapshot) => !files.has(snapshot.file))
            .map((snapshot) => snapshot.file),
        ],
      },
      snapshots
    )
    await putIndex(current.saved, index, current.etag, true)
    const cleanupComplete = await cleanHistory(current.saved, index)
    return {
      history: await readWebdavHistory(),
      changed: true,
      cleanupComplete,
    }
  })
}
export async function applyWebdavSnapshot(
  history: WebdavHistory,
  snapshotId: string
) {
  return navigator.locks.request("omt-webdav", async () => {
    const current = await currentHistory(history)
    const target = current.snapshots.find(
      (snapshot) => snapshot.id === snapshotId
    )
    if (!target) throw new Error(i18n.t("settings.webdav.conflict"))
    const revision = await storageRevision()
    if (!current.index) throw new Error(i18n.t("settings.webdav.conflict"))
    const contents = await readIndexedSnapshot(current.saved, target)
    const backup = contents.backup
    await currentHistory(current)
    await restoreBackup(backup, revision)
    const latest = current.snapshots[0]
    const saved: SavedWebdav = {
      ...current.saved,
      ...(latest
        ? { baseline: { localHash: latest.hash, remoteId: latest.id } }
        : {}),
      lastSyncAt: Date.now(),
      connectedAt: Date.now(),
    }
    await writeEntries({ [WEBDAV_KEY]: JSON.stringify(saved) }, true, {
      [WEBDAV_KEY]: current.raw,
    })
    return { saved }
  })
}
export async function deleteWebdavSnapshot(
  history: WebdavHistory,
  snapshotId: string
) {
  return navigator.locks.request("omt-webdav", async () => {
    const current = await currentHistory(history)
    const target = current.snapshots.find(
      (snapshot) => snapshot.id === snapshotId
    )
    if (!target) throw new Error(i18n.t("settings.webdav.conflict"))
    let cleanupComplete = true
    if (current.index) {
      const matchesTarget = (snapshot: WebdavSnapshot) =>
        snapshot.id === target.id ||
        (!target.manual && !snapshot.manual && snapshot.hash === target.hash)
      const removed = current.index.snapshots.filter(matchesTarget)
      const remaining = current.index.snapshots.filter(
        (snapshot) => !matchesTarget(snapshot)
      )
      const index = retainedIndex(
        {
          ...current.index,
          garbage: [
            ...current.index.garbage,
            ...removed.map((snapshot) => snapshot.file),
          ],
        },
        remaining
      )
      await putIndex(current.saved, index, current.etag, true)
      cleanupComplete = await cleanHistory(current.saved, index)
    }
    return { history: await readWebdavHistory(), cleanupComplete }
  })
}
export function syncPlanSnapshots(plan: WebdavSyncPlan): WebdavSnapshot[] {
  if (plan.remote.index)
    return uniqueWebdavSnapshots(plan.remote.index.snapshots)
  return []
}

export async function executeWebdavSync(
  plan: WebdavSyncPlan,
  direction: Exclude<SyncDirection, "choose">,
  options: { forceSnapshot?: boolean; snapshotId?: string } = {}
) {
  return navigator.locks.request("omt-webdav", async () => {
    await assertCurrent(plan)
    const current = await remoteState(plan.saved)
    if (
      current.id !== plan.remote.id ||
      current.hash !== plan.remote.hash ||
      current.indexEtag !== plan.remote.indexEtag
    )
      throw new Error(i18n.t("settings.webdav.conflict"))
    await assertCurrent(plan)
    let remoteId = current.id!
    let localHash = plan.localHash
    let cleanupComplete = true
    if (
      direction === "upload" &&
      !options.forceSnapshot &&
      (current.hash === plan.localHash ||
        current.index?.snapshots.some(
          (snapshot) => snapshot.hash === plan.localHash
        ))
    ) {
      const settled = current.index
        ? await settleHistory(plan.saved, current.index, current.indexEtag)
        : null
      const cleanupComplete = settled?.cleanupComplete ?? true
      return {
        saved: plan.saved,
        restored: false,
        cleanupComplete,
        duplicate: true,
      }
    }
    if (direction === "upload") {
      condition(current.indexEtag, !!current.index)
      const id = crypto.randomUUID()
      const file = `oh-my-tab-snapshot-${id}.zip`
      const response = await requestWebdav(plan.saved, "PUT", {
        file,
        headers: { "Content-Type": "application/zip", "If-None-Match": "*" },
        body: plan.localBlob,
      })
      checkWebdavResponse(response)
      await response.body?.cancel()
      const change = current.backup
        ? compareBackupContent(
            {
              config: current.backup.config,
              image: current.backup.image
                ? await contentHash(null, current.backup.image)
                : null,
            },
            {
              config: plan.localBackup.config,
              image: plan.localBackup.image
                ? await contentHash(null, plan.localBackup.image)
                : null,
            }
          )
        : null
      const uploadedAt = Date.now()
      const snapshot: WebdavSnapshot = {
        id,
        file,
        deviceId: plan.saved.deviceId,
        ...(options.forceSnapshot ? { manual: true } : {}),
        uploadedAt,
        name: defaultWebdavSnapshotName(uploadedAt),
        hash: plan.localHash,
        change,
      }
      const all = [snapshot, ...(current.index?.snapshots ?? [])]
      const index = retainedIndex(
        current.index ?? {
          version: 4,
          snapshotLimit: plan.saved.snapshotLimit,
          snapshots: [],
          garbage: [],
        },
        all,
        plan.saved.snapshotLimit
      )
      // The index is the commit point: a failed conditional PUT publishes
      // nothing and keeps committed snapshots.
      try {
        await assertCurrent(plan)
        await putIndex(plan.saved, index, current.indexEtag, !!current.index)
      } catch (error) {
        // The PUT may have committed before failing; check the index before
        // deleting this attempt's snapshot.
        try {
          const observed = await remoteState(plan.saved)
          if (
            observed.index &&
            !observed.index.snapshots.some((item) => item.id === id)
          ) {
            const removed = await requestWebdav(plan.saved, "DELETE", { file })
            await removed.body?.cancel()
          }
        } catch {
          /* Leave uncertain uploads intact. */
        }
        throw error
      }
      remoteId = id
      cleanupComplete = await cleanHistory(plan.saved, index)
    } else if (direction === "download") {
      if (!current.backup)
        throw new Error(i18n.t("settings.webdav.noRemoteBackup"))
      const selected = options.snapshotId
        ? syncPlanSnapshots(plan).find(
            (snapshot) => snapshot.id === options.snapshotId
          )
        : undefined
      if (options.snapshotId && !selected)
        throw new Error(i18n.t("settings.webdav.conflict"))
      let backup = current.backup
      localHash = current.hash!
      if (selected && selected.id !== current.id) {
        const contents = current.index
          ? await readIndexedSnapshot(plan.saved, selected)
          : null
        if (!contents) throw new Error(i18n.t("settings.webdav.conflict"))
        backup = contents.backup
        localHash = contents.hash
        const index = retainedIndex(current.index!, [
          selected,
          ...current.index!.snapshots.filter(
            (snapshot) => snapshot.id !== selected.id
          ),
        ])
        await assertCurrent(plan)
        await putIndex(plan.saved, index, current.indexEtag, true)
        cleanupComplete = await cleanHistory(plan.saved, index)
        remoteId = selected.id
      }
      await restoreBackup(backup, plan.revision)
      if (current.index && (!selected || selected.id === current.id))
        cleanupComplete = await cleanHistory(plan.saved, current.index)
    } else if (current.index) {
      const settled = await settleHistory(
        plan.saved,
        current.index,
        current.indexEtag
      )
      cleanupComplete = settled.cleanupComplete
      remoteId = settled.index.snapshots[0]?.id ?? remoteId
    }
    const saved: SavedWebdav = {
      ...plan.saved,
      baseline: { localHash, remoteId },
      lastSyncAt: Date.now(),
      connectedAt: Date.now(),
    }
    await writeEntries({ [WEBDAV_KEY]: JSON.stringify(saved) }, true, {
      [WEBDAV_KEY]: plan.raw,
    })
    return {
      saved,
      restored: direction === "download",
      cleanupComplete,
      duplicate: false,
    }
  })
}

export async function createWebdavSnapshot() {
  const plan = await prepareWebdavSync()
  return executeWebdavSync(plan, "upload", { forceSnapshot: true })
}
