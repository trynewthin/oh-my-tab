import { beforeEach, describe, expect, it } from "vitest"
import { clearAllData, flushStorage, storageRevision } from "@/lib/storage"
import {
  snapshot,
  importConfig,
  type Config,
} from "@/application/config-transfer"
import { createBackup, readBackup } from "@/application/backup"
import { rehydrateData } from "@/application/hydrate"
import { contentHash } from "@/lib/webdav-sync"
import {
  prepareSync,
  executeSync,
  readSyncHistory,
  resetRemoteIndex,
  type SyncSession,
  type SyncStore,
} from "@/application/sync/engine"
import type { SyncBackend } from "@/lib/sync/backend"
import type { RemoteIndex, WebdavSnapshot } from "@/lib/webdav-history"
import { parseRemoteIndex } from "@/lib/webdav-history"

const initial = JSON.parse(JSON.stringify(snapshot())) as Config
initial.grid.items = []
initial.grid.layouts = {}
initial.garden.initialized = true
initial.garden.pointsUpdatedAt = 0

// In-memory backend: conditional writes behave like a strong-ETag server.
const files = new Map<string, { blob: Blob; etag: string }>()
let revision = 0
const backend: SyncBackend = {
  id: "fake",
  capabilities: {
    conditionalWrites: true,
    listing: true,
    maxFileBytes: 64 * 1024 * 1024,
  },
  get: async (path) => {
    const file = files.get(path)
    return file
      ? { blob: file.blob, etag: file.etag, lastModified: null }
      : null
  },
  put: async (path, blob, condition) => {
    const existing = files.get(path)
    if (condition?.ifNoneMatch && existing) throw new Error("412 conflict")
    if (condition?.ifMatch && condition.ifMatch !== existing?.etag)
      throw new Error("412 conflict")
    const etag = `"${++revision}"`
    files.set(path, { blob, etag })
    return etag
  },
  delete: async (path) => {
    files.delete(path)
  },
  list: async (prefix) =>
    [...files.keys()].filter((name) => name.startsWith(prefix)),
}

type TestSession = SyncSession
let session: TestSession
let raw: string
const store: SyncStore<TestSession> = {
  read: async () => ({ session, raw }),
  write: async (next, expectedRaw) => {
    if (raw !== expectedRaw) throw new Error("stale session")
    session = next
    raw = JSON.stringify(next)
  },
}

async function seed(text: string) {
  const config = structuredClone(initial)
  config.home.text = text
  await importConfig(config, await storageRevision())
  await rehydrateData()
  await flushStorage()
}

async function makeSnapshot(manual = false) {
  const blob = await createBackup()
  const backup = await readBackup(blob)
  const hash = await contentHash(backup.config, backup.image)
  const id = crypto.randomUUID()
  const file = `oh-my-tab-snapshot-${id}.zip`
  await backend.put(file, blob, { ifNoneMatch: true })
  const snapshotEntry: WebdavSnapshot = {
    id,
    file,
    deviceId: "other-device",
    ...(manual ? { manual: true } : {}),
    uploadedAt: Date.now(),
    name: `snapshot-${id.slice(0, 8)}`,
    hash,
    change: null,
  }
  return snapshotEntry
}

async function writeIndex(snapshots: WebdavSnapshot[]) {
  const index: RemoteIndex = {
    version: 4,
    snapshotLimit: 5,
    snapshots,
    garbage: [],
  }
  const existing = files.get("oh-my-tab-sync.json")
  await backend.put(
    "oh-my-tab-sync.json",
    new Blob([JSON.stringify(index)], { type: "application/json" }),
    existing ? { ifMatch: existing.etag } : { ifNoneMatch: true }
  )
}

beforeEach(async () => {
  files.clear()
  revision = 0
  await flushStorage().catch(() => {})
  await clearAllData()
  await seed("INITIAL")
  session = {
    deviceId: "test-device",
    snapshotLimit: 5,
    connectedAt: Date.now(),
  }
  raw = JSON.stringify(session)
})

describe("readSyncHistory", () => {
  it("marks a corrupt snapshot instead of failing the history", async () => {
    const broken = await makeSnapshot(true)
    files.set(broken.file, { blob: new Blob(["garbage"]), etag: '"x1"' })
    const good = await makeSnapshot(true)
    await writeIndex([broken, good])
    const history = await readSyncHistory({ backend, store })
    expect(history.indexCorrupt).toBe(false)
    expect(history.snapshots[0].state).toBe("corrupt")
    expect(history.snapshots[1].state).toBeUndefined()
  })

  it("marks a missing snapshot file as corrupt", async () => {
    const missing = await makeSnapshot(true)
    const good = await makeSnapshot(true)
    files.delete(missing.file)
    await writeIndex([missing, good])
    const history = await readSyncHistory({ backend, store })
    expect(history.snapshots[0].state).toBe("corrupt")
    expect(history.snapshots[1].state).toBeUndefined()
  })

  it("reports indexCorrupt when the index is unparseable", async () => {
    await backend.put(
      "oh-my-tab-sync.json",
      new Blob(["{ not an index"]),
      undefined
    )
    const history = await readSyncHistory({ backend, store })
    expect(history.indexCorrupt).toBe(true)
    expect(history.snapshots).toEqual([])
  })
})

describe("remoteState fallback", () => {
  it("falls back to the first readable snapshot", async () => {
    const broken = await makeSnapshot(true)
    files.delete(broken.file)
    const good = await makeSnapshot(true)
    await writeIndex([broken, good])
    const plan = await prepareSync({ backend, store })
    expect(plan.remote.id).toBe(good.id)
    expect(plan.remote.corrupt).toEqual([broken.id])
  })

  it("reports no remote when every snapshot is unreadable", async () => {
    const broken = await makeSnapshot()
    files.delete(broken.file)
    await writeIndex([broken])
    const plan = await prepareSync({ backend, store })
    expect(plan.remote.id).toBeUndefined()
    expect(plan.remote.corrupt).toEqual([broken.id])
  })
})

describe("executeSync over a corrupt index", () => {
  it("uploads and rebuilds the index", async () => {
    files.set("oh-my-tab-sync.json", {
      blob: new Blob(["{ corrupted index"]),
      etag: '"corrupt-etag"',
    })
    const plan = await prepareSync({ backend, store })
    expect(plan.remote.indexCorrupt).toBe(true)
    const result = await executeSync(plan, "upload", { forceSnapshot: true })
    expect(result.restored).toBe(false)
    const index = parseRemoteIndex(
      await files.get("oh-my-tab-sync.json")!.blob.text()
    )
    expect(index.snapshots).toHaveLength(1)
    expect(index.snapshots[0].deviceId).toBe("test-device")
  })
})

describe("resetRemoteIndex", () => {
  it("resets an unparseable index to empty", async () => {
    files.set("oh-my-tab-sync.json", {
      blob: new Blob(["{ broken"]),
      etag: '"x"',
    })
    const result = await resetRemoteIndex({ backend, store })
    expect(result.reset).toBe(true)
    const index = parseRemoteIndex(
      await files.get("oh-my-tab-sync.json")!.blob.text()
    )
    expect(index.snapshots).toEqual([])
    expect(index.garbage).toEqual([])
  })

  it("refuses to reset a healthy index with snapshots", async () => {
    const snapshotEntry = await makeSnapshot()
    await writeIndex([snapshotEntry])
    await expect(resetRemoteIndex({ backend, store })).rejects.toThrow()
    expect(files.get("oh-my-tab-sync.json")).toBeTruthy()
  })

  it("resets when no index exists", async () => {
    const result = await resetRemoteIndex({ backend, store })
    expect(result.reset).toBe(true)
    expect(files.get("oh-my-tab-sync.json")).toBeTruthy()
  })
})

describe("resilience regressions", () => {
  it("treats a backend read failure as a corrupt snapshot, not a history abort", async () => {
    const broken = await makeSnapshot(true)
    const good = await makeSnapshot(true)
    await writeIndex([broken, good])
    const failing: SyncBackend = {
      ...backend,
      get: async (path, maxBytes) => {
        if (path === broken.file) throw new Error("500 boom")
        return backend.get(path, maxBytes)
      },
    }
    const history = await readSyncHistory({ backend: failing, store })
    expect(history.snapshots[0].state).toBe("corrupt")
    expect(history.snapshots[1].state).toBeUndefined()
  })

  it("drops the damaged duplicate, keeps the healthy copy and never persists state", async () => {
    const good = await makeSnapshot()
    // Same content hash as `good`, but its file was never uploaded: a
    // damage-aware dedup must keep `good`, not the dead index entry.
    const dupId = crypto.randomUUID()
    const deadDuplicate = {
      ...good,
      id: dupId,
      file: `oh-my-tab-snapshot-${dupId}.zip`,
    }
    await writeIndex([deadDuplicate, good])
    // Local changes force a real upload, so dedup runs over the index.
    await seed("CHANGED")
    const plan = await prepareSync({ backend, store })
    expect(plan.remote.corrupt).toContain(deadDuplicate.id)
    await executeSync(plan, "upload", { forceSnapshot: true })
    const indexText = await files.get("oh-my-tab-sync.json")!.blob.text()
    const index = parseRemoteIndex(indexText)
    expect(index.snapshots.some((s) => s.id === deadDuplicate.id)).toBe(false)
    expect(index.snapshots.some((s) => s.id === good.id)).toBe(true)
    // `state` is a read-time annotation; persisting it would flag a repaired
    // file as corrupt forever.
    expect(indexText).not.toContain('"state"')
  })

  it("refuses to reset the index when the connection changed mid-read", async () => {
    await expect(
      resetRemoteIndex({ backend, store, expectedRaw: "different-raw" })
    ).rejects.toThrow()
  })
})
