import { CONFIG_VERSION } from "@/lib/data-version"
import {
  migrateRemoteHistory,
  RemoteIndexError,
} from "@/lib/migrations/webdav-history"
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
} from "@/application/backup"
import { storageRevision } from "@/lib/storage"
import type { SyncBackend } from "@/lib/sync/backend"
import {
  compareBackupContent,
  contentHash,
  syncDirection,
  stableJson,
  defaultWebdavSnapshotName,
  validWebdavSnapshotName,
  webdavSnapshotName,
  type ChangeSummary,
  type SyncBaseline,
  type SyncDirection,
} from "@/lib/webdav-sync"

const INDEX_FILE = "oh-my-tab-sync.json"
const MAX_INDEX_BYTES = 4 * 1024 * 1024
const MAX_SNAPSHOTS = 10000

// The backend-agnostic session persisted by the provider layer. Provider
// secrets (url, credentials) live on the concrete saved type, not here.
export type SyncSession = {
  deviceId: string
  snapshotLimit: number
  connectedAt: number
  baseline?: SyncBaseline
  lastSyncAt?: number
}

export type SyncStore<S extends SyncSession> = {
  read(): Promise<{ session: S; raw: string } | null>
  write(session: S, expectedRaw: string): Promise<void>
}

type RemoteState = {
  index: RemoteIndex | null
  indexEtag: string | null
  indexCorrupt: boolean
  backup: Backup | null
  hash?: string
  id?: string
  deviceId?: string
  uploadedAt?: number | null
  modifiedAt?: number | null
  large: boolean
  change: ChangeSummary | null
  corrupt: string[]
  legacy: string[]
}

export type SyncPlan<S extends SyncSession = SyncSession> = {
  backend: SyncBackend
  session: S
  store: SyncStore<S>
  raw: string
  revision: string | undefined
  localBlob: Blob
  localHash: string
  localBackup: Backup
  remote: RemoteState
  direction: SyncDirection
}

type SnapshotRead =
  | { status: "ok"; backup: Backup; hash: string }
  | { status: "legacy" }
  | { status: "corrupt" }

async function readIndexedSnapshot(
  backend: SyncBackend,
  snapshot: WebdavSnapshot
): Promise<SnapshotRead> {
  // Any fetch failure (missing, oversized, unreadable response) degrades
  // this snapshot to corrupt instead of aborting the whole history read.
  const file = await backend.get(snapshot.file).catch(() => null)
  if (!file) return { status: "corrupt" }
  let contents
  try {
    contents = await readBackupContents(file.blob)
  } catch {
    return { status: "corrupt" }
  }
  if (
    (contents.sourceConfig as { version?: unknown } | null)?.version !==
    CONFIG_VERSION
  )
    return { status: "legacy" }
  const sourceHash = await contentHash(
    contents.sourceConfig,
    contents.backup.image
  )
  if (sourceHash !== snapshot.hash) return { status: "corrupt" }
  return {
    status: "ok",
    backup: contents.backup,
    hash: await contentHash(contents.backup.config, contents.backup.image),
  }
}

const WEAK_ETAG_DELAY = 1100
const WEAK_ETAG_ATTEMPTS = 3

// Some DAV servers (Apache httpd among them) answer with a weak "W/" ETag
// for a file modified within the last second. Weak validators cannot be used
// for conditional writes, so re-read once the freshness window has passed.
async function freshIndex(backend: SyncBackend) {
  for (let attempt = 0; ; attempt++) {
    const file = await backend.get(INDEX_FILE, MAX_INDEX_BYTES)
    if (
      !file ||
      !file.etag?.startsWith("W/") ||
      attempt === WEAK_ETAG_ATTEMPTS - 1
    )
      return file
    await new Promise((resolve) => setTimeout(resolve, WEAK_ETAG_DELAY))
  }
}

async function readCurrentIndex(backend: SyncBackend, snapshotLimit: number) {
  return migrateRemoteHistory({
    snapshotLimit,
    fetch: (file, maxBytes) => backend.get(file, maxBytes),
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
      await backend.put(file, body, { ifNoneMatch: true })
    },
    cleanup: (index) => cleanHistory(backend, index),
    putIndex: (index, etag, exists) => putIndex(backend, index, etag, exists),
    removeSource: (file, etag) => backend.delete(file, { ifMatch: etag! }),
  })
}

async function remoteState(
  backend: SyncBackend,
  snapshotLimit: number
): Promise<RemoteState> {
  let indexFile
  try {
    indexFile = await readCurrentIndex(backend, snapshotLimit)
    if (indexFile?.etag?.startsWith("W/"))
      indexFile = (await freshIndex(backend)) ?? indexFile
  } catch (error) {
    if (error instanceof RemoteIndexError) {
      // Another device may have repaired the index between reads: if the
      // latest file parses, fall through to the normal path with it.
      const latest = await freshIndex(backend).catch(() => null)
      if (latest)
        try {
          parseRemoteIndex(await latest.blob.text())
          indexFile = latest
        } catch {
          indexFile = undefined
        }
      if (!indexFile)
        return {
          index: null,
          indexEtag: latest?.etag ?? null,
          indexCorrupt: true,
          backup: null,
          large: false,
          change: null,
          corrupt: [],
          legacy: [],
        }
    } else throw error
  }
  if (!indexFile)
    return {
      index: null,
      indexEtag: null,
      indexCorrupt: false,
      backup: null,
      large: false,
      change: null,
      corrupt: [],
      legacy: [],
    }
  let index: RemoteIndex
  try {
    index = parseRemoteIndex(await indexFile.blob.text())
  } catch {
    return {
      index: null,
      indexEtag: indexFile.etag,
      indexCorrupt: true,
      backup: null,
      large: false,
      change: null,
      corrupt: [],
      legacy: [],
    }
  }
  // Fall back from newest to oldest: the first fully readable snapshot is
  // current; failures are marked instead of failing the whole history.
  const corrupt: string[] = []
  const legacy: string[] = []
  for (const snapshot of index.snapshots) {
    const read = await readIndexedSnapshot(backend, snapshot)
    if (read.status === "ok")
      return {
        index,
        indexEtag: indexFile.etag,
        indexCorrupt: false,
        ...read,
        id: snapshot.id,
        deviceId: snapshot.deviceId,
        uploadedAt: snapshot.uploadedAt,
        large: snapshot.change?.large ?? true,
        change: snapshot.change,
        corrupt,
        legacy,
      }
    if (read.status === "legacy") legacy.push(snapshot.id)
    else corrupt.push(snapshot.id)
  }
  return {
    index,
    indexEtag: indexFile.etag,
    indexCorrupt: false,
    backup: null,
    large: false,
    change: null,
    corrupt,
    legacy,
  }
}

export async function prepareSync<S extends SyncSession>(options: {
  backend: SyncBackend
  store: SyncStore<S>
}): Promise<SyncPlan<S>> {
  const { backend, store } = options
  const current = await store.read()
  if (!current || typeof current.raw !== "string")
    throw new Error(i18n.t("settings.webdav.notConnected"))
  const { session, raw } = current
  const revision = await storageRevision()
  const localBlob = await createBackup()
  const localBackup = await readBackup(localBlob)
  const localHash = await contentHash(localBackup.config, localBackup.image)
  const remote = await remoteState(backend, session.snapshotLimit)
  const direction = syncDirection({
    localHash,
    remoteHash: remote.hash,
    remoteId: remote.id,
    remoteDevice: remote.deviceId,
    deviceId: session.deviceId,
    baseline: session.baseline,
    large: remote.large,
  })
  const plan: SyncPlan<S> = {
    backend,
    session,
    store,
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

async function assertCurrent<S extends SyncSession>(plan: SyncPlan<S>) {
  if ((await storageRevision()) !== plan.revision)
    throw new Error(i18n.t("settings.webdav.dataChanged"))
  const current = await plan.store.read()
  if (!current || current.raw !== plan.raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
}

function condition(
  backend: SyncBackend,
  etag: string | null,
  exists: boolean
): { ifMatch?: string; ifNoneMatch?: true } {
  if (!backend.capabilities.conditionalWrites) return {}
  if (exists && (!etag || etag.startsWith("W/")))
    throw new Error(i18n.t("settings.webdav.weakEtagServer"))
  return exists ? { ifMatch: etag! } : { ifNoneMatch: true }
}

async function putIndex(
  backend: SyncBackend,
  index: RemoteIndex,
  etag: string | null,
  exists: boolean
) {
  const body = new Blob([JSON.stringify(index)], { type: "application/json" })
  if (index.snapshots.length > MAX_SNAPSHOTS || body.size > MAX_INDEX_BYTES)
    throw new Error(i18n.t("settings.webdav.historyFull"))
  await backend.put(INDEX_FILE, body, condition(backend, etag, exists))
}

async function cleanHistory(
  backend: SyncBackend,
  index: RemoteIndex
): Promise<boolean> {
  if (!index.garbage.length) return true
  const failed: string[] = []
  for (const file of index.garbage) {
    try {
      await backend.delete(file)
    } catch {
      failed.push(file)
    }
  }
  // Clear garbage only if the index is unchanged; never overwrite another
  // upload.
  try {
    const current = await freshIndex(backend)
    if (current) {
      const latest = parseRemoteIndex(await current.blob.text())
      if (stableJson(latest) === stableJson(index))
        await putIndex(
          backend,
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

const damaged = (snapshot: MarkedSnapshot) =>
  snapshot.state === "corrupt" || snapshot.state === "legacy"

export function uniqueSnapshots(snapshots: MarkedSnapshot[]) {
  const hashes = new Map<string, MarkedSnapshot>()
  for (const snapshot of snapshots) {
    if (snapshot.manual) continue
    const previous = hashes.get(snapshot.hash)
    // A healthy copy always outranks a damaged one: dedup must not keep a
    // corrupt entry and garbage-collect its readable replacement.
    if (
      !previous ||
      (damaged(previous) && !damaged(snapshot)) ||
      (damaged(previous) === damaged(snapshot) &&
        !previous.protected &&
        snapshot.protected)
    )
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
  const retained = uniqueSnapshots(snapshots).filter(
    (snapshot) => snapshot.protected || ++automaticCount <= snapshotLimit
  )
  const files = new Set(retained.map((snapshot) => snapshot.file))
  return {
    ...index,
    version: 4,
    snapshotLimit,
    // `state` is a read-time annotation, not history: never persist it, or a
    // repaired file would stay flagged corrupt forever.
    snapshots: retained.map((snapshot) => {
      const { state, ...rest } = snapshot
      void state
      return rest
    }),
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
  backend: SyncBackend,
  index: RemoteIndex,
  etag: string | null
) {
  const unique = retainedIndex(index, index.snapshots)
  if (stableJson(unique) !== stableJson(index))
    await putIndex(backend, unique, etag, true)
  return {
    index: unique,
    cleanupComplete: await cleanHistory(backend, unique),
  }
}

export type SnapshotStatus = "ok" | "legacy" | "corrupt"
export type MarkedSnapshot = WebdavSnapshot & { state?: SnapshotStatus }

export type SyncHistory<S extends SyncSession = SyncSession> = {
  backend: SyncBackend
  session: S
  store: SyncStore<S>
  raw: string
  index: RemoteIndex | null
  indexCorrupt: boolean
  etag: string | null
  snapshots: MarkedSnapshot[]
}

export async function readSyncHistory<S extends SyncSession>(options: {
  backend: SyncBackend
  store: SyncStore<S>
}): Promise<SyncHistory<S>> {
  const { backend, store } = options
  const current = await store.read()
  if (!current || typeof current.raw !== "string")
    throw new Error(i18n.t("settings.webdav.notConnected"))
  const { session, raw } = current
  let file
  try {
    file = await readCurrentIndex(backend, session.snapshotLimit)
    if (file?.etag?.startsWith("W/")) file = (await freshIndex(backend)) ?? file
  } catch (error) {
    if (!(error instanceof RemoteIndexError)) throw error
    return {
      backend,
      session,
      store,
      raw,
      index: null,
      indexCorrupt: true,
      etag: null,
      snapshots: [],
    }
  }
  let index: RemoteIndex | null = null
  let indexCorrupt = false
  if (file)
    try {
      index = parseRemoteIndex(await file.blob.text())
    } catch {
      indexCorrupt = true
    }
  const snapshots: MarkedSnapshot[] = []
  if (index)
    for (const snapshot of uniqueSnapshots(index.snapshots)) {
      const read = await readIndexedSnapshot(backend, snapshot)
      snapshots.push({
        ...snapshot,
        // Fresh reads always win over a state persisted by an older write.
        state: read.status === "ok" ? undefined : read.status,
      })
    }
  const persisted = await store.read()
  if (!persisted || persisted.raw !== raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  return {
    backend,
    session,
    store,
    raw,
    index,
    indexCorrupt,
    etag: file?.etag ?? null,
    snapshots,
  }
}

async function currentHistory<S extends SyncSession>(history: SyncHistory<S>) {
  const current = await readSyncHistory({
    backend: history.backend,
    store: history.store,
  })
  if (current.raw !== history.raw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  if (
    current.etag !== history.etag ||
    stableJson(current.snapshots) !== stableJson(history.snapshots)
  )
    throw new Error(i18n.t("settings.webdav.conflict"))
  return current
}

export async function renameSnapshot<S extends SyncSession>(
  history: SyncHistory<S>,
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
    await putIndex(current.backend, index, current.etag, true)
    const cleanupComplete = await cleanHistory(current.backend, index)
    return {
      history: await readSyncHistory({
        backend: current.backend,
        store: current.store,
      }),
      changed: true,
      cleanupComplete,
    }
  })
}

export async function applySnapshot<S extends SyncSession>(
  history: SyncHistory<S>,
  snapshotId: string
) {
  return navigator.locks.request("omt-webdav", async () => {
    const current = await currentHistory(history)
    const target = current.snapshots.find(
      (snapshot) => snapshot.id === snapshotId
    )
    if (!target) throw new Error(i18n.t("settings.webdav.conflict"))
    if (target.state === "corrupt")
      throw new Error(i18n.t("settings.webdav.invalidHistory"))
    const revision = await storageRevision()
    if (!current.index) throw new Error(i18n.t("settings.webdav.conflict"))
    const contents = await readIndexedSnapshot(current.backend, target)
    if (contents.status !== "ok")
      throw new Error(i18n.t("settings.webdav.invalidHistory"))
    const backup = contents.backup
    await currentHistory(current)
    await restoreBackup(backup, revision)
    // Mirror remoteState: the baseline tracks the first readable snapshot,
    // not the index head, which may be a damaged entry.
    const latest = current.snapshots.find(
      (snapshot) => snapshot.state !== "corrupt" && snapshot.state !== "legacy"
    )
    const session = {
      ...current.session,
      ...(latest
        ? { baseline: { localHash: latest.hash, remoteId: latest.id } }
        : {}),
      lastSyncAt: Date.now(),
      connectedAt: Date.now(),
    }
    await history.store.write(session, current.raw)
    return { session }
  })
}

export async function deleteSnapshot<S extends SyncSession>(
  history: SyncHistory<S>,
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
      await putIndex(current.backend, index, current.etag, true)
      cleanupComplete = await cleanHistory(current.backend, index)
    }
    return {
      history: await readSyncHistory({
        backend: current.backend,
        store: current.store,
      }),
      cleanupComplete,
    }
  })
}

// The index exists but is unreadable or written by an unrecognized format:
// replace it with an empty index so sync can resume. Existing snapshot files
// become orphaned and are collected through the garbage list.
export async function resetRemoteIndex<S extends SyncSession>(options: {
  backend: SyncBackend
  store: SyncStore<S>
  // The raw settings the backend was built from; a different live value
  // means the connection changed between reads.
  expectedRaw?: string
}) {
  const { backend, store, expectedRaw } = options
  const current = await store.read()
  if (!current || typeof current.raw !== "string")
    throw new Error(i18n.t("settings.webdav.notConnected"))
  if (expectedRaw !== undefined && current.raw !== expectedRaw)
    throw new Error(i18n.t("settings.webdav.connectionChanged"))
  return navigator.locks.request("omt-webdav", async () => {
    const latest = await freshIndex(backend)
    // Refuse to wipe a healthy, non-empty index: that is real history, not
    // corruption.
    if (latest)
      try {
        const index = parseRemoteIndex(await latest.blob.text())
        if (index.snapshots.length || index.garbage.length)
          throw new Error(i18n.t("settings.webdav.conflict"))
        return { reset: false }
      } catch (error) {
        if (
          error instanceof Error &&
          error.message === i18n.t("settings.webdav.conflict")
        )
          throw error
      }
    const empty: RemoteIndex = {
      version: 4,
      snapshotLimit: current.session.snapshotLimit,
      snapshots: [],
      garbage: [],
    }
    await putIndex(backend, empty, latest?.etag ?? null, !!latest)
    return { reset: true }
  })
}

export function syncPlanSnapshots<S extends SyncSession>(
  plan: SyncPlan<S>
): MarkedSnapshot[] {
  if (!plan.remote.index) return []
  const corrupt = new Set(plan.remote.corrupt)
  const legacy = new Set(plan.remote.legacy)
  return uniqueSnapshots(plan.remote.index.snapshots).map((snapshot) =>
    corrupt.has(snapshot.id)
      ? { ...snapshot, state: "corrupt" as const }
      : legacy.has(snapshot.id)
        ? { ...snapshot, state: "legacy" as const }
        : snapshot
  )
}

export async function executeSync<S extends SyncSession>(
  plan: SyncPlan<S>,
  direction: Exclude<SyncDirection, "choose">,
  options: { forceSnapshot?: boolean; snapshotId?: string } = {}
) {
  return navigator.locks.request("omt-webdav", async () => {
    const { backend } = plan
    await assertCurrent(plan)
    const current = await remoteState(backend, plan.session.snapshotLimit)
    if (current.indexCorrupt && direction !== "upload")
      throw new Error(i18n.t("settings.webdav.invalidHistory"))
    if (
      !current.indexCorrupt &&
      (current.id !== plan.remote.id ||
        current.hash !== plan.remote.hash ||
        current.indexEtag !== plan.remote.indexEtag)
    )
      throw new Error(i18n.t("settings.webdav.conflict"))
    await assertCurrent(plan)
    let remoteId = current.id!
    let localHash = plan.localHash
    let cleanupComplete = true
    if (
      direction === "upload" &&
      !options.forceSnapshot &&
      !current.indexCorrupt &&
      (current.hash === plan.localHash ||
        current.index?.snapshots.some(
          // Only a snapshot this client verified it can read counts as
          // coverage; a damaged copy must not suppress a fresh upload.
          (snapshot) =>
            snapshot.hash === plan.localHash &&
            !current.corrupt.includes(snapshot.id) &&
            !current.legacy.includes(snapshot.id)
        ))
    ) {
      const settled = current.index
        ? await settleHistory(backend, current.index, current.indexEtag)
        : null
      const cleanupComplete = settled?.cleanupComplete ?? true
      return {
        session: plan.session,
        restored: false,
        cleanupComplete,
        duplicate: true,
      }
    }
    if (direction === "upload") {
      const id = crypto.randomUUID()
      const file = `oh-my-tab-snapshot-${id}.zip`
      await backend.put(file, plan.localBlob, {
        ifNoneMatch: true,
      })
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
        deviceId: plan.session.deviceId,
        ...(options.forceSnapshot ? { manual: true } : {}),
        uploadedAt,
        name: defaultWebdavSnapshotName(uploadedAt),
        hash: plan.localHash,
        change,
      }
      // Carry the read marks into dedup so a damaged snapshot cannot win
      // the hash slot over this verified upload and get it garbage-collected.
      const all = [
        snapshot,
        ...(current.index?.snapshots ?? []).map((entry) =>
          current.corrupt.includes(entry.id)
            ? { ...entry, state: "corrupt" as const }
            : current.legacy.includes(entry.id)
              ? { ...entry, state: "legacy" as const }
              : entry
        ),
      ]
      const index = retainedIndex(
        current.index ?? {
          version: 4,
          snapshotLimit: plan.session.snapshotLimit,
          snapshots: [],
          garbage: [],
        },
        all,
        plan.session.snapshotLimit
      )
      // The index is the commit point: a failed conditional PUT publishes
      // nothing and keeps committed snapshots. A corrupt index file still
      // exists remotely, so overwrite it conditionally by its ETag.
      try {
        await assertCurrent(plan)
        await putIndex(
          backend,
          index,
          current.indexEtag,
          !!current.index || current.indexEtag !== null
        )
      } catch (error) {
        // The PUT may have committed before failing; check the index before
        // deleting this attempt's snapshot.
        try {
          const observed = await remoteState(
            backend,
            plan.session.snapshotLimit
          )
          if (
            observed.index &&
            !observed.index.snapshots.some((item) => item.id === id)
          ) {
            await backend.delete(file)
          }
        } catch {
          /* Leave uncertain uploads intact. */
        }
        throw error
      }
      remoteId = id
      cleanupComplete = await cleanHistory(backend, index)
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
        const contents = await readIndexedSnapshot(backend, selected)
        if (contents.status !== "ok")
          throw new Error(
            contents.status === "legacy"
              ? i18n.t("settings.webdav.legacySnapshotError")
              : i18n.t("settings.webdav.invalidHistory")
          )
        backup = contents.backup
        localHash = contents.hash
        const index = retainedIndex(current.index!, [
          selected,
          ...current.index!.snapshots.filter(
            (snapshot) => snapshot.id !== selected.id
          ),
        ])
        await assertCurrent(plan)
        await putIndex(backend, index, current.indexEtag, true)
        cleanupComplete = await cleanHistory(backend, index)
        remoteId = selected.id
      }
      await restoreBackup(backup, plan.revision)
      if (current.index && (!selected || selected.id === current.id))
        cleanupComplete = await cleanHistory(backend, current.index)
    } else if (current.index) {
      const settled = await settleHistory(
        backend,
        current.index,
        current.indexEtag
      )
      cleanupComplete = settled.cleanupComplete
      // The baseline mirrors what the next remoteState will pick as remote
      // head: the first snapshot that was verified readable — settled head
      // when it is readable, the fallback otherwise.
      remoteId =
        settled.index.snapshots.find(
          (snapshot) =>
            !current.corrupt.includes(snapshot.id) &&
            !current.legacy.includes(snapshot.id)
        )?.id ?? remoteId
    }
    const session = {
      ...plan.session,
      baseline: { localHash, remoteId },
      lastSyncAt: Date.now(),
      connectedAt: Date.now(),
    }
    await plan.store.write(session, plan.raw)
    return { session, restored: direction === "download", cleanupComplete }
  })
}
