import { i18n } from "@/i18n"
import { createBackup, readBackup, restoreBackup, type Backup } from "./backup"
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
  validSnapshotLimit,
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
const snapshotFile = /^oh-my-tab-snapshot-[a-f0-9-]{36}\.zip$/
export type WebdavSnapshot = {
  id: string
  file: string
  deviceId: string
  manual?: boolean
  name?: string
  protected?: boolean
  uploadedAt: number | null
  modifiedAt?: number | null
  hash: string
  change: ChangeSummary | null
}
type RemoteIndex = {
  version: 1 | 2 | 3
  snapshotLimit: number
  snapshots: WebdavSnapshot[]
  garbage: string[]
}
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
export function parseRemoteIndex(text: string): RemoteIndex {
  const value = JSON.parse(text)
  if (
    ![1, 2, 3].includes(value?.version) ||
    !validSnapshotLimit(value.snapshotLimit) ||
    !Array.isArray(value.snapshots) ||
    value.snapshots.length > MAX_SNAPSHOTS ||
    !Array.isArray(value.garbage) ||
    value.garbage.length > 1000
  )
    invalidIndex()
  const ids = new Set<string>()
  const protectedHashes = new Set<string>()
  for (const item of value.snapshots) {
    if (
      !item ||
      typeof item.id !== "string" ||
      !snapshotFile.test(item.file) ||
      item.file !== `oh-my-tab-snapshot-${item.id}.zip` ||
      ids.has(item.id) ||
      typeof item.deviceId !== "string" ||
      (item.manual !== undefined && typeof item.manual !== "boolean") ||
      (item.uploadedAt !== null &&
        (!Number.isFinite(item.uploadedAt) ||
          item.uploadedAt < 0 ||
          item.uploadedAt > 8.64e15)) ||
      (item.modifiedAt != null &&
        (!Number.isFinite(item.modifiedAt) ||
          item.modifiedAt < 0 ||
          item.modifiedAt > 8.64e15)) ||
      (item.name !== undefined && !validWebdavSnapshotName(item.name)) ||
      (item.protected !== undefined && typeof item.protected !== "boolean") ||
      !/^[a-f0-9]{64}$/.test(item.hash)
    )
      invalidIndex()
    ids.add(item.id)
    if (item.protected && !item.manual) {
      if (protectedHashes.has(item.hash)) invalidIndex()
      protectedHashes.add(item.hash)
    }
    if (
      item.change !== null &&
      (!item.change ||
        typeof item.change.large !== "boolean" ||
        !Number.isFinite(item.change.ratio) ||
        item.change.ratio < 0 ||
        item.change.ratio > 1 ||
        !Number.isInteger(item.change.changed) ||
        !Number.isInteger(item.change.removed) ||
        !Number.isInteger(item.change.total))
    )
      invalidIndex()
  }
  const active = new Set(
    value.snapshots.map((item: WebdavSnapshot) => item.file)
  )
  if (
    !value.garbage.every(
      (file: unknown) =>
        typeof file === "string" && snapshotFile.test(file) && !active.has(file)
    )
  )
    invalidIndex()
  return value
}
async function remoteState(connection: WebdavConnection): Promise<RemoteState> {
  const indexFile = await fetchRemoteBackup(
    connection,
    INDEX_FILE,
    MAX_INDEX_BYTES
  )
  if (!indexFile) {
    const legacy = await fetchRemoteBackup(connection)
    const backup = legacy ? await readBackup(legacy.blob) : null
    const hash = backup
      ? await contentHash(backup.config, backup.image)
      : undefined
    return {
      index: null,
      indexEtag: null,
      backup,
      hash,
      id: hash,
      modifiedAt: legacy?.lastModified ?? null,
      large: !!backup,
      change: null,
    }
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
  const file = await fetchRemoteBackup(connection, latest.file)
  if (!file) invalidIndex()
  const backup = await readBackup(file.blob)
  const hash = await contentHash(backup.config, backup.image)
  if (hash !== latest.hash) invalidIndex()
  return {
    index,
    indexEtag: indexFile.etag,
    backup,
    hash,
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
  // Clearing the cleanup list is conditional: never overwrite another upload.
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
    // Readers without protection support must reject this index instead of
    // applying their old retention rule to renamed snapshots.
    version:
      index.version === 3 || retained.some((snapshot) => snapshot.manual)
        ? 3
        : index.version === 2 || retained.some((snapshot) => snapshot.protected)
          ? 2
          : 1,
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
  legacyEtag: string | null
  snapshots: WebdavSnapshot[]
}
export async function readWebdavHistory(): Promise<WebdavHistory> {
  const { saved, raw } = await readWebdavSettings()
  if (!saved || typeof raw !== "string")
    throw new Error(i18n.t("settings.webdav.notConnected"))
  const file = await fetchRemoteBackup(saved, INDEX_FILE, MAX_INDEX_BYTES)
  let index: RemoteIndex | null = null
  let legacyEtag: string | null = null
  let snapshots: WebdavSnapshot[] = []
  if (file) {
    index = parseRemoteIndex(await file.blob.text())
    snapshots = uniqueWebdavSnapshots(index.snapshots)
  } else {
    const legacy = await fetchRemoteBackup(saved)
    if (legacy) {
      const backup = await readBackup(legacy.blob)
      const hash = await contentHash(backup.config, backup.image)
      legacyEtag = legacy.etag
      snapshots = [
        {
          id: hash,
          file: "oh-my-tab.zip",
          deviceId: "",
          uploadedAt: null,
          modifiedAt: legacy.lastModified,
          hash,
          change: null,
        },
      ]
    }
  }
  if ((await readEntries([WEBDAV_KEY]))[WEBDAV_KEY] !== raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  return { saved, raw, index, etag: file?.etag ?? null, legacyEtag, snapshots }
}
async function currentHistory(history: WebdavHistory) {
  const current = await readWebdavHistory()
  if (current.raw !== history.raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  if (
    current.etag !== history.etag ||
    current.legacyEtag !== history.legacyEtag ||
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
    let index: RemoteIndex
    if (current.index) {
      // Use the deduplicated view so naming one content version cannot create
      // several protected copies of the same content.
      const snapshots = current.snapshots.map((snapshot) =>
        snapshot.id === snapshotId
          ? { ...snapshot, name, protected: true }
          : snapshot
      )
      const files = new Set(snapshots.map((snapshot) => snapshot.file))
      index = retainedIndex(
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
    } else {
      const file = await fetchRemoteBackup(current.saved)
      if (!file || file.etag !== current.legacyEtag)
        throw new Error(i18n.t("settings.webdav.conflict"))
      const backup = await readBackup(file.blob)
      if ((await contentHash(backup.config, backup.image)) !== target.hash)
        throw new Error(i18n.t("settings.webdav.conflict"))
      const id = crypto.randomUUID()
      const filename = `oh-my-tab-snapshot-${id}.zip`
      const response = await requestWebdav(current.saved, "PUT", {
        file: filename,
        headers: { "Content-Type": "application/zip", "If-None-Match": "*" },
        body: file.blob,
      })
      checkWebdavResponse(response)
      await response.body?.cancel()
      index = {
        version: 2,
        snapshotLimit: current.saved.snapshotLimit,
        snapshots: [{ ...target, id, file: filename, name, protected: true }],
        garbage: [],
      }
      try {
        await currentHistory(current)
        await putIndex(current.saved, index, null, false)
      } catch (error) {
        // A network error can occur after commit; only clean up an upload when
        // a readable index proves it is not referenced.
        try {
          const observed = await readWebdavHistory()
          if (
            observed.index &&
            !observed.index.snapshots.some((snapshot) => snapshot.id === id)
          ) {
            const removed = await requestWebdav(current.saved, "DELETE", {
              file: filename,
            })
            await removed.body?.cancel()
          }
        } catch {
          /* Keep an upload whose commit status is unknown. */
        }
        throw error
      }
    }
    const cleanupComplete = await cleanHistory(current.saved, index)
    return {
      history: await readWebdavHistory(),
      changed: true,
      cleanupComplete,
    }
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
    } else {
      const response = await requestWebdav(current.saved, "DELETE", {
        file: "oh-my-tab.zip",
        headers: condition(current.legacyEtag, true),
      })
      if (response.status !== 404) checkWebdavResponse(response)
      await response.body?.cancel()
    }
    return { history: await readWebdavHistory(), cleanupComplete }
  })
}
export function syncPlanSnapshots(plan: WebdavSyncPlan): WebdavSnapshot[] {
  if (plan.remote.index)
    return uniqueWebdavSnapshots(plan.remote.index.snapshots)
  if (!plan.remote.hash || !plan.remote.id) return []
  return [
    {
      id: plan.remote.id,
      file: "oh-my-tab.zip",
      deviceId: "",
      uploadedAt: null,
      modifiedAt: plan.remote.modifiedAt ?? null,
      hash: plan.remote.hash,
      change: null,
    },
  ]
}

export async function executeWebdavSync(
  plan: WebdavSyncPlan,
  direction: Exclude<SyncDirection, "choose">,
  options: { forceSnapshot?: boolean } = {}
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
          version: 1,
          snapshotLimit: plan.saved.snapshotLimit,
          snapshots: [],
          garbage: [],
        },
        all,
        plan.saved.snapshotLimit
      )
      // The index is the commit point. A failed conditional PUT cannot publish
      // a partial version or remove any previously committed snapshot.
      try {
        await assertCurrent(plan)
        await putIndex(plan.saved, index, current.indexEtag, !!current.index)
      } catch (error) {
        // The request may have committed before a network failure. Check the
        // index before deleting this attempt's immutable snapshot.
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
      await restoreBackup(current.backup, plan.revision)
      localHash = current.hash!
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
