import { beforeEach, afterEach, describe, expect, it, vi } from "vitest"
import {
  clearAllData,
  flushStorage,
  readEntries,
  storageRevision,
  writeEntries,
} from "@/lib/storage"
import {
  snapshot,
  importConfig,
  type Config,
} from "@/application/config-transfer"
import { createBackup, readBackup } from "@/application/backup"
import { rehydrateData } from "@/application/hydrate"
import { contentHash, defaultWebdavSnapshotName } from "@/lib/webdav-sync"
import { decodeBackup } from "@/lib/backup-codec"
import {
  prepareWebdavSync,
  executeWebdavSync,
  parseRemoteIndex,
  readWebdavHistory,
  deleteWebdavSnapshot,
  renameWebdavSnapshot,
  createWebdavSnapshot,
  type WebdavSnapshot,
  syncPlanSnapshots,
} from "@/application/webdav-sync"
import {
  parseWebdavSettings,
  readWebdavSettings,
  saveWebdavSettings,
  removeWebdavSettings,
  type SavedWebdav,
} from "@/application/webdav-settings"

const connection = {
  url: "https://dav.example.com/test/",
  username: "test-user",
  password: "test-password-local-only",
}
const initial = JSON.parse(JSON.stringify(snapshot())) as Config
initial.grid.items = []
initial.grid.layouts = {}
initial.garden.initialized = true
initial.garden.pointsUpdatedAt = 0
const files = new Map<
  string,
  { blob: Blob; etag: string; lastModified?: string }
>()
let revision = 0
let denyDelete = false
let denyIndex = false
let weakIndex = false
async function seed(text: string) {
  const config = structuredClone(initial)
  config.home.text = text
  await importConfig(config, await storageRevision())
  await rehydrateData()
  await flushStorage()
}
async function currentBackup() {
  await rehydrateData()
  await flushStorage()
  return readBackup(await createBackup())
}
async function readIndex() {
  return parseRemoteIndex(await files.get("oh-my-tab-sync.json")!.blob.text())
}
async function sync(direction?: "upload" | "download" | "equal") {
  const plan = await prepareWebdavSync()
  expect(plan.direction).not.toBe("choose")
  return executeWebdavSync(
    plan,
    direction ?? (plan.direction as "upload" | "download" | "equal")
  )
}
async function useDevice(saved: SavedWebdav, text: string) {
  await seed(text)
  await writeEntries({ "omt.webdav": JSON.stringify(saved) })
}
beforeEach(async () => {
  vi.unstubAllGlobals()
  files.clear()
  revision = 0
  denyDelete = denyIndex = weakIndex = false
  await flushStorage().catch(() => {})
  await clearAllData()
  await seed("INITIAL")
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string, options: RequestInit) => {
      const file = new URL(url).pathname.split("/").at(-1)!
      const headers = options.headers as Record<string, string>
      const existing = files.get(file)
      if (options.method === "PROPFIND")
        return new Response(null, { status: 207 })
      if (options.method === "GET")
        return existing
          ? new Response(existing.blob, {
              headers: {
                ...(existing.lastModified
                  ? { "Last-Modified": existing.lastModified }
                  : {}),
                ETag:
                  weakIndex && file === "oh-my-tab-sync.json"
                    ? 'W/"weak"'
                    : existing.etag,
              },
            })
          : new Response(null, { status: 404 })
      if (options.method === "DELETE") {
        if (denyDelete) return new Response(null, { status: 403 })
        if (headers["If-Match"] && headers["If-Match"] !== existing?.etag)
          return new Response(null, { status: 412 })
        files.delete(file)
        return new Response(null, { status: 204 })
      }
      if (options.method === "PUT") {
        if (file === "oh-my-tab-sync.json" && denyIndex)
          return new Response(null, { status: 412 })
        if (
          (headers["If-None-Match"] === "*" && existing) ||
          (headers["If-Match"] && headers["If-Match"] !== existing?.etag)
        )
          return new Response(null, { status: 412 })
        files.set(file, { blob: options.body as Blob, etag: `"${++revision}"` })
        return new Response(null, { status: 201 })
      }
      throw new Error(`Unexpected method ${options.method}`)
    })
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe("persisted WebDAV connections", () => {
  it.each(["http:", "chrome-extension:"])(
    "persists credentials and settings with %s storage",
    async (protocol) => {
      const local: Record<string, unknown> = {}
      vi.stubGlobal("location", { protocol })
      if (protocol === "chrome-extension:")
        vi.stubGlobal("chrome", {
          storage: {
            local: {
              get: async (keys: string[]) =>
                Object.fromEntries(keys.map((key) => [key, local[key]])),
              set: async (values: Record<string, unknown>) => {
                Object.assign(local, values)
              },
            },
          },
        })
      const saved = await saveWebdavSettings(connection, 7)
      expect((await readWebdavSettings()).saved).toEqual(saved)
      expect(saved.password).toBe(connection.password)
      expect(saved.snapshotLimit).toBe(7)
      expect(saved.deviceId).toBeTruthy()
      await removeWebdavSettings()
      expect((await readWebdavSettings()).saved).toBeUndefined()
    }
  )
  it("preserves legacy fields without pretending to have saved credentials", () => {
    expect(
      parseWebdavSettings(
        JSON.stringify({ url: connection.url, username: connection.username })
      )
    ).toEqual({ connection: { ...connection, password: "" }, saved: null })
  })
  it("resets the sync baseline when changing directory even if form state carries saved fields", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const previous = (await readWebdavSettings()).saved!
    expect(previous.baseline).toBeDefined()
    const changed = await saveWebdavSettings(
      { ...previous, url: "https://dav.example.com/other/" },
      8
    )
    expect(changed.baseline).toBeUndefined()
    expect(changed.lastSyncAt).toBeUndefined()
    expect(changed.deviceId).toBe(previous.deviceId)
  })
  it("does not overwrite a working connection on authentication failure", async () => {
    const saved = await saveWebdavSettings(connection, 5)
    vi.stubGlobal("fetch", async () => new Response(null, { status: 401 }))
    await expect(
      saveWebdavSettings({ ...connection, password: "wrong" }, 8)
    ).rejects.toThrow(/认证/)
    expect((await readWebdavSettings()).saved).toEqual(saved)
  })
})

describe("WebDAV snapshot sync", () => {
  it("uploads an initial snapshot, persists the baseline and excludes credentials from ZIP", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const index = await readIndex()
    expect(index.snapshots).toHaveLength(1)
    const saved = (await readWebdavSettings()).saved!
    expect(index.snapshots[0].deviceId).toBe(saved.deviceId)
    expect(saved.baseline?.remoteId).toBe(index.snapshots[0].id)
    const backup = await decodeBackup(files.get(index.snapshots[0].file)!.blob)
    expect(JSON.stringify(backup)).not.toContain(connection.password)
    expect(JSON.stringify(backup)).not.toContain(connection.username)
    expect(JSON.stringify(backup)).not.toContain(saved.deviceId)
    expect((await prepareWebdavSync()).direction).toBe("equal")
    await sync()
    expect((await readIndex()).snapshots).toHaveLength(1)
  })
  it("keeps five snapshots by default and applies a new retention limit", async () => {
    await saveWebdavSettings(connection, 5)
    for (let i = 0; i < 7; i++) {
      await seed(`VERSION ${i}`)
      await sync()
    }
    expect((await readIndex()).snapshots).toHaveLength(5)
    expect(
      [...files.keys()].filter((file) => file.endsWith(".zip"))
    ).toHaveLength(5)
    await saveWebdavSettings(connection, 2)
    await seed("VERSION 8")
    await sync()
    expect((await readIndex()).snapshots).toHaveLength(2)
    expect(
      [...files.keys()].filter((file) => file.endsWith(".zip"))
    ).toHaveLength(2)
  })
  it("retries failed cleanup without losing the committed version", async () => {
    await saveWebdavSettings(connection, 1)
    await sync()
    await seed("NEW")
    denyDelete = true
    expect((await sync()).cleanupComplete).toBe(false)
    expect((await readIndex()).snapshots).toHaveLength(1)
    expect((await readIndex()).garbage).toHaveLength(1)
    denyDelete = false
    expect((await sync()).cleanupComplete).toBe(true)
    expect((await readIndex()).garbage).toHaveLength(0)
    expect(
      [...files.keys()].filter((file) => file.endsWith(".zip"))
    ).toHaveLength(1)
  })
  it("downloads on first contact, records the baseline and then follows remote updates", async () => {
    const a = await saveWebdavSettings(connection, 5)
    await sync()
    const aSynced = (await readWebdavSettings()).saved!
    await removeWebdavSettings()
    await seed("DEVICE B")
    await saveWebdavSettings(connection, 5)
    const first = await prepareWebdavSync()
    expect(first.direction).toBe("download")
    expect(first.remote.large).toBe(true)
    const remoteBefore = await readIndex()
    const filesBefore = [...files.keys()]
    const requestCount = vi.mocked(fetch).mock.calls.length
    await executeWebdavSync(first, "download")
    expect(
      vi
        .mocked(fetch)
        .mock.calls.slice(requestCount)
        .every(([, options]) => options?.method === "GET")
    ).toBe(true)
    expect(await readIndex()).toEqual(remoteBefore)
    expect([...files.keys()]).toEqual(filesBefore)
    const bSynced = (await readWebdavSettings()).saved!
    expect(bSynced.baseline).toEqual({
      localHash: first.remote.hash,
      remoteId: first.remote.id,
    })
    expect((await currentBackup()).config.home.text).toBe("INITIAL")
    await useDevice(aSynced, "A UPDATE")
    await sync()
    expect((await readIndex()).snapshots[0].deviceId).toBe(a.deviceId)
    await useDevice(bSynced, "INITIAL")
    const next = await prepareWebdavSync()
    expect(next.direction).toBe("download")
    await executeWebdavSync(next, "download")
    expect((await currentBackup()).config.home.text).toBe("A UPDATE")
    expect((await prepareWebdavSync()).direction).toBe("equal")
  })
  it("requires a choice when both sides change and rejects stale choices", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const baseline = (await readWebdavSettings()).saved!
    await seed("REMOTE EDIT")
    await sync()
    await useDevice(
      { ...baseline, deviceId: crypto.randomUUID() },
      "LOCAL EDIT"
    )
    const conflict = await prepareWebdavSync()
    expect(conflict.direction).toBe("choose")
    expect(syncPlanSnapshots(conflict)).toEqual((await readIndex()).snapshots)
    const remoteBefore = await readIndex()
    await seed("NEW LOCAL EDIT")
    await expect(executeWebdavSync(conflict, "download")).rejects.toThrow(
      /本机数据已变化/
    )
    expect(await readIndex()).toEqual(remoteBefore)
  })
  it("rejects concurrent remote writes without dropping existing snapshots", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("LOCAL EDIT")
    const plan = await prepareWebdavSync()
    const before = await readIndex()
    denyIndex = true
    await expect(executeWebdavSync(plan, "upload")).rejects.toThrow(
      /云端数据已变化/
    )
    expect(await readIndex()).toEqual(before)
    expect(files.has(before.snapshots[0].file)).toBe(true)
    expect(
      [...files.keys()].filter((file) => file.endsWith(".zip"))
    ).toHaveLength(1)
  })
  it("rejects remote changes made after the version chooser was opened", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("LOCAL EDIT")
    const plan = await prepareWebdavSync()
    const index = files.get("oh-my-tab-sync.json")!
    files.set("oh-my-tab-sync.json", { ...index, etag: '"another-writer"' })
    await expect(executeWebdavSync(plan, "upload")).rejects.toThrow(
      /云端数据已变化/
    )
    expect(
      [...files.keys()].filter((file) => file.endsWith(".zip"))
    ).toHaveLength(1)
  })
  it("asks about large remote changes and leaves both versions unchanged on prepare", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const previous = (await readWebdavSettings()).saved!
    await seed("NEW REMOTE")
    await sync()
    const indexFile = files.get("oh-my-tab-sync.json")!
    const index = await readIndex()
    index.snapshots[0].change = {
      changed: 40,
      removed: 6,
      total: 100,
      ratio: 0.4,
      large: true,
    }
    files.set("oh-my-tab-sync.json", {
      ...indexFile,
      blob: new Blob([JSON.stringify(index)]),
    })
    await useDevice({ ...previous, deviceId: crypto.randomUUID() }, "INITIAL")
    const before = await readIndex()
    expect((await prepareWebdavSync()).direction).toBe("choose")
    expect(await readIndex()).toEqual(before)
    expect((await currentBackup()).config.home.text).toBe("INITIAL")
  })
  it("rejects weak ETags before uploading a new snapshot", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("NEW")
    weakIndex = true
    const plan = await prepareWebdavSync()
    const count = files.size
    await expect(executeWebdavSync(plan, "upload")).rejects.toThrow(/ETag/)
    expect(files.size).toBe(count)
  })
  it("deleting a connection cancels pending sync without touching remote snapshots or local data", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("NEW")
    const plan = await prepareWebdavSync()
    const remote = await readIndex()
    await removeWebdavSettings()
    await expect(executeWebdavSync(plan, "upload")).rejects.toThrow(
      /连接配置已变化/
    )
    expect(await readIndex()).toEqual(remote)
    expect((await currentBackup()).config.home.text).toBe("NEW")
    expect((await readEntries(["omt.webdav"]))["omt.webdav"]).toBeNull()
  })
  it("initializes directly from legacy ZIP backups", async () => {
    files.set("oh-my-tab.zip", { blob: await createBackup(), etag: '"legacy"' })
    await seed("LOCAL")
    await saveWebdavSettings(connection, 5)
    const plan = await prepareWebdavSync()
    expect(plan.direction).toBe("download")
    await executeWebdavSync(plan, "download")
    expect((await currentBackup()).config.home.text).toBe("INITIAL")
  })
  it("rejects history paths outside the snapshot namespace", () => {
    expect(() =>
      parseRemoteIndex(
        JSON.stringify({
          version: 1,
          snapshotLimit: 5,
          snapshots: [
            {
              id: "x",
              file: "../private",
              deviceId: "d",
              uploadedAt: 1,
              hash: "a".repeat(64),
              change: null,
            },
          ],
          garbage: [],
        })
      )
    ).toThrow(/损坏/)
  })
})

describe("WebDAV snapshot history", () => {
  it("creates distinct manual snapshots even when their contents match", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const original = (await readIndex()).snapshots[0]
    await createWebdavSnapshot()
    await createWebdavSnapshot()
    const index = await readIndex()
    expect(index.version).toBe(3)
    expect(index.snapshots).toHaveLength(3)
    expect(index.snapshots.map((snapshot) => snapshot.hash)).toEqual([
      original.hash,
      original.hash,
      original.hash,
    ])
    expect(index.snapshots.map((snapshot) => snapshot.manual)).toEqual([
      true,
      true,
      undefined,
    ])
    expect((await readWebdavHistory()).snapshots).toEqual(index.snapshots)
    const before = structuredClone(index)
    expect((await prepareWebdavSync()).direction).toBe("equal")
    await sync()
    expect(await readIndex()).toEqual(before)
  })
  it("deletes only the selected manual snapshot when contents match", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await createWebdavSnapshot()
    const history = await readWebdavHistory()
    const manual = history.snapshots[0]
    const original = history.snapshots[1]
    await deleteWebdavSnapshot(history, manual.id)
    expect(files.has(manual.file)).toBe(false)
    expect(files.has(original.file)).toBe(true)
    expect((await readWebdavHistory()).snapshots).toEqual([original])
  })
  it("does not upload, reorder or refresh timestamps for content already in history", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("VERSION B")
    await sync()
    const before = await readIndex()
    const saved = (await readWebdavSettings()).saved
    await seed("INITIAL")
    const count = vi.mocked(fetch).mock.calls.length
    const result = await sync()
    expect(result.duplicate).toBe(true)
    expect(await readIndex()).toEqual(before)
    expect((await readWebdavSettings()).saved).toEqual(saved)
    expect(
      vi
        .mocked(fetch)
        .mock.calls.slice(count)
        .every(([, options]) => options?.method === "GET")
    ).toBe(true)
    expect(
      [...files.keys()].filter((file) => file.endsWith(".zip"))
    ).toHaveLength(2)
  })
  it("lists snapshots newest first without writing or changing local data", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("NEXT")
    await sync()
    const count = vi.mocked(fetch).mock.calls.length
    const history = await readWebdavHistory()
    expect(history.snapshots.map((item) => item.id)).toEqual(
      (await readIndex()).snapshots.map((item) => item.id)
    )
    expect(history.snapshots).toHaveLength(2)
    expect(
      vi
        .mocked(fetch)
        .mock.calls.slice(count)
        .every(([, options]) => options?.method === "GET")
    ).toBe(true)
    expect((await currentBackup()).config.home.text).toBe("NEXT")
  })
  it("deduplicates pre-existing history on sync and keeps the newest metadata", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const index = await readIndex()
    const original = index.snapshots[0]
    const id = crypto.randomUUID()
    const duplicate = {
      ...original,
      id,
      file: `oh-my-tab-snapshot-${id}.zip`,
      uploadedAt: original.uploadedAt! + 1000,
    }
    files.set(duplicate.file, { ...files.get(original.file)! })
    index.snapshots.unshift(duplicate)
    files.set("oh-my-tab-sync.json", {
      blob: new Blob([JSON.stringify(index)]),
      etag: '"duplicates"',
    })
    expect((await readWebdavHistory()).snapshots).toEqual([duplicate])
    await sync()
    expect((await readIndex()).snapshots).toEqual([duplicate])
    expect(files.has(original.file)).toBe(false)
    expect(files.has(duplicate.file)).toBe(true)
  })
  it("deletes an older snapshot without changing the latest snapshot, credentials or local data", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("LATEST")
    await sync()
    const saved = (await readWebdavSettings()).saved
    const history = await readWebdavHistory()
    const older = history.snapshots[1]
    const result = await deleteWebdavSnapshot(history, older.id)
    expect(result.cleanupComplete).toBe(true)
    expect(result.history.snapshots).toEqual([history.snapshots[0]])
    expect(files.has(older.file)).toBe(false)
    expect((await readWebdavSettings()).saved).toEqual(saved)
    expect((await currentBackup()).config.home.text).toBe("LATEST")
  })
  it("promotes the preceding snapshot when deleting the latest", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("LATEST")
    await sync()
    const history = await readWebdavHistory()
    const result = await deleteWebdavSnapshot(history, history.snapshots[0].id)
    expect(result.history.snapshots).toEqual([history.snapshots[1]])
    expect(files.has(history.snapshots[0].file)).toBe(false)
    expect((await currentBackup()).config.home.text).toBe("LATEST")
  })
  it("keeps an empty index after deleting the last snapshot and does not resurrect a legacy backup", async () => {
    const legacy = await createBackup()
    await saveWebdavSettings(connection, 5)
    await sync()
    files.set("oh-my-tab.zip", { blob: legacy, etag: '"legacy"' })
    const history = await readWebdavHistory()
    const result = await deleteWebdavSnapshot(history, history.snapshots[0].id)
    expect(result.history.snapshots).toEqual([])
    expect((await readIndex()).snapshots).toEqual([])
    expect((await prepareWebdavSync()).direction).toBe("upload")
    await sync()
    expect((await readIndex()).snapshots).toHaveLength(1)
  })
  it("rejects stale deletion requests before deleting any file", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    const file = files.get("oh-my-tab-sync.json")!
    files.set("oh-my-tab-sync.json", { ...file, etag: '"concurrent"' })
    await expect(
      deleteWebdavSnapshot(history, history.snapshots[0].id)
    ).rejects.toThrow(/云端数据已变化/)
    expect(files.has(history.snapshots[0].file)).toBe(true)
    expect((await readIndex()).snapshots).toEqual(history.snapshots)
  })
  it("does not delete snapshot files when the conditional index update fails", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    denyIndex = true
    await expect(
      deleteWebdavSnapshot(history, history.snapshots[0].id)
    ).rejects.toThrow(/云端数据已变化/)
    expect(files.has(history.snapshots[0].file)).toBe(true)
    expect((await readIndex()).snapshots).toEqual(history.snapshots)
  })
  it("reports incomplete deletion and retries cleanup on the next sync", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    await seed("LATEST")
    await sync()
    const history = await readWebdavHistory()
    const older = history.snapshots[1]
    denyDelete = true
    const result = await deleteWebdavSnapshot(history, older.id)
    expect(result.cleanupComplete).toBe(false)
    expect(result.history.snapshots).toHaveLength(1)
    expect(result.history.index?.garbage).toContain(older.file)
    expect(files.has(older.file)).toBe(true)
    denyDelete = false
    await sync()
    expect(files.has(older.file)).toBe(false)
    expect((await readIndex()).garbage).toEqual([])
  })
  it("lists and conditionally deletes legacy backups", async () => {
    files.set("oh-my-tab.zip", { blob: await createBackup(), etag: '"legacy"' })
    await saveWebdavSettings(connection, 5)
    const history = await readWebdavHistory()
    expect(history.snapshots[0].file).toBe("oh-my-tab.zip")
    expect(
      (await deleteWebdavSnapshot(history, history.snapshots[0].id)).history
        .snapshots
    ).toEqual([])
    expect(files.has("oh-my-tab.zip")).toBe(false)
  })
  it("does not delete anything after the connection is removed", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    await removeWebdavSettings()
    await expect(
      deleteWebdavSnapshot(history, history.snapshots[0].id)
    ).rejects.toThrow(/连接/)
    expect(files.has(history.snapshots[0].file)).toBe(true)
  })
  it("deletes all pre-existing copies of the selected content", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const index = await readIndex()
    const original = index.snapshots[0]
    const id = crypto.randomUUID()
    const duplicate = { ...original, id, file: `oh-my-tab-snapshot-${id}.zip` }
    files.set(duplicate.file, { ...files.get(original.file)! })
    index.snapshots.push(duplicate)
    files.set("oh-my-tab-sync.json", {
      blob: new Blob([JSON.stringify(index)]),
      etag: '"duplicates"',
    })
    const history = await readWebdavHistory()
    expect(history.snapshots).toHaveLength(1)
    await deleteWebdavSnapshot(history, original.id)
    expect(files.has(original.file)).toBe(false)
    expect(files.has(duplicate.file)).toBe(false)
    expect((await readWebdavHistory()).snapshots).toEqual([])
  })
  it("refuses deletion with a weak index ETag", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    weakIndex = true
    const history = await readWebdavHistory()
    await expect(
      deleteWebdavSnapshot(history, history.snapshots[0].id)
    ).rejects.toThrow(/ETag/)
    expect(files.has(history.snapshots[0].file)).toBe(true)
  })
  it("reads file modification time for standalone backups in history and sync dialogs", async () => {
    const modified = "Tue, 29 Sep 2026 12:00:00 GMT"
    files.set("oh-my-tab.zip", {
      blob: await createBackup(),
      etag: '"standalone"',
      lastModified: modified,
    })
    await saveWebdavSettings(connection, 5)
    const history = await readWebdavHistory()
    const snapshots = syncPlanSnapshots(await prepareWebdavSync())
    expect(history.snapshots[0]).toMatchObject({
      file: "oh-my-tab.zip",
      uploadedAt: null,
      modifiedAt: Date.parse(modified),
    })
    expect(snapshots).toEqual(history.snapshots)
  })
  it("keeps missing standalone times unknown rather than assigning a timestamp", async () => {
    files.set("oh-my-tab.zip", {
      blob: await createBackup(),
      etag: '"standalone"',
    })
    await saveWebdavSettings(connection, 5)
    expect((await readWebdavHistory()).snapshots[0]).toMatchObject({
      file: "oh-my-tab.zip",
      uploadedAt: null,
      modifiedAt: null,
    })
  })
})

describe("snapshot names and retention", () => {
  it("stores a default timestamp name on every upload", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const snapshot = (await readIndex()).snapshots[0]
    expect(snapshot.name).toBe(defaultWebdavSnapshotName(snapshot.uploadedAt!))
    expect(snapshot.protected).toBeUndefined()
  })
  it("renames metadata without changing contents, order or upload time", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    const original = history.snapshots[0]
    const file = files.get(original.file)
    const saved = (await readWebdavSettings()).saved
    const result = await renameWebdavSnapshot(
      history,
      original.id,
      "  发布前备份  "
    )
    expect(result.changed).toBe(true)
    expect(result.history.index?.version).toBe(2)
    expect(result.history.snapshots[0]).toEqual({
      ...original,
      name: "发布前备份",
      protected: true,
    })
    expect(files.get(original.file)).toBe(file)
    expect((await readWebdavHistory()).snapshots[0].name).toBe("发布前备份")
    expect((await readWebdavSettings()).saved).toEqual(saved)
    expect((await prepareWebdavSync()).direction).toBe("equal")
  })
  it("does not protect or write a snapshot when its name is unchanged", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    const file = files.get("oh-my-tab-sync.json")
    const result = await renameWebdavSnapshot(
      history,
      history.snapshots[0].id,
      history.snapshots[0].name!
    )
    expect(result.changed).toBe(false)
    expect(result.history.snapshots[0].protected).toBeUndefined()
    expect(files.get("oh-my-tab-sync.json")).toBe(file)
  })
  it("keeps renamed snapshots in addition to the automatic retention count", async () => {
    await saveWebdavSettings(connection, 2)
    await sync()
    const history = await readWebdavHistory()
    const original = history.snapshots[0]
    await renameWebdavSnapshot(history, original.id, "Keep this")
    for (let i = 0; i < 4; i++) {
      await seed(`VERSION ${i}`)
      await sync()
    }
    let snapshots = (await readIndex()).snapshots
    expect(snapshots).toHaveLength(3)
    expect(snapshots.filter((snapshot) => !snapshot.protected)).toHaveLength(2)
    expect(
      snapshots.find((snapshot) => snapshot.id === original.id)?.name
    ).toBe("Keep this")
    await saveWebdavSettings(connection, 1)
    await seed("LATEST")
    await sync()
    snapshots = (await readIndex()).snapshots
    expect(snapshots).toHaveLength(2)
    expect(files.has(original.file)).toBe(true)
    await seed("INITIAL")
    expect((await sync()).duplicate).toBe(true)
    expect((await readIndex()).snapshots).toEqual(snapshots)
  })
  it("keeps protection if a custom name is later changed back to its timestamp", async () => {
    await saveWebdavSettings(connection, 1)
    await sync()
    const history = await readWebdavHistory()
    const original = history.snapshots[0]
    const renamed = await renameWebdavSnapshot(history, original.id, "Keep")
    const reverted = await renameWebdavSnapshot(
      renamed.history,
      original.id,
      original.name!
    )
    expect(reverted.history.snapshots[0].protected).toBe(true)
    await seed("NEW")
    await sync()
    expect(files.has(original.file)).toBe(true)
  })
  it("deduplicates toward the protected copy without losing its name", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    const original = history.snapshots[0]
    await renameWebdavSnapshot(history, original.id, "Keep")
    const index = await readIndex()
    const id = crypto.randomUUID()
    const duplicate = { ...original, id, file: `oh-my-tab-snapshot-${id}.zip` }
    files.set(duplicate.file, { ...files.get(original.file)! })
    index.snapshots.unshift(duplicate)
    files.set("oh-my-tab-sync.json", {
      blob: new Blob([JSON.stringify(index)]),
      etag: '"duplicates"',
    })
    await sync()
    expect((await readIndex()).snapshots).toEqual([
      { ...original, name: "Keep", protected: true },
    ])
    expect(files.has(original.file)).toBe(true)
    expect(files.has(duplicate.file)).toBe(false)
    expect((await readWebdavSettings()).saved?.baseline?.remoteId).toBe(
      original.id
    )
  })
  it("allows manual deletion of renamed snapshots", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    const original = history.snapshots[0]
    const renamed = await renameWebdavSnapshot(history, original.id, "Keep")
    await deleteWebdavSnapshot(renamed.history, original.id)
    expect(files.has(original.file)).toBe(false)
    expect((await readWebdavHistory()).snapshots).toEqual([])
  })
  it("rejects invalid names and stale changes without modifying the index", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    const id = history.snapshots[0].id
    const file = files.get("oh-my-tab-sync.json")!
    for (const name of ["", " ", "x".repeat(81), "line\nbreak"])
      await expect(renameWebdavSnapshot(history, id, name)).rejects.toThrow(
        /名称/
      )
    expect(files.get("oh-my-tab-sync.json")).toBe(file)
    files.set("oh-my-tab-sync.json", { ...file, etag: '"changed"' })
    await expect(renameWebdavSnapshot(history, id, "Keep")).rejects.toThrow(
      /云端数据已变化/
    )
    expect((await readIndex()).snapshots[0].protected).toBeUndefined()
  })
  it("does not change a name if the conditional write is rejected", async () => {
    await saveWebdavSettings(connection, 5)
    await sync()
    const history = await readWebdavHistory()
    denyIndex = true
    await expect(
      renameWebdavSnapshot(history, history.snapshots[0].id, "Keep")
    ).rejects.toThrow(/云端数据已变化/)
    expect((await readIndex()).snapshots).toEqual(history.snapshots)
  })
  it("registers standalone backups as protected snapshots without changing their bytes", async () => {
    const blob = await createBackup()
    files.set("oh-my-tab.zip", {
      blob,
      etag: '"standalone"',
      lastModified: "Tue, 29 Sep 2026 12:00:00 GMT",
    })
    await saveWebdavSettings(connection, 1)
    const history = await readWebdavHistory()
    const renamed = await renameWebdavSnapshot(
      history,
      history.snapshots[0].id,
      "Keep original"
    )
    const snapshot = renamed.history.snapshots[0]
    expect(snapshot).toMatchObject({
      name: "Keep original",
      protected: true,
      uploadedAt: null,
      modifiedAt: Date.UTC(2026, 8, 29, 12),
    })
    expect(await files.get(snapshot.file)!.blob.arrayBuffer()).toEqual(
      await blob.arrayBuffer()
    )
    await sync()
    await seed("AFTER")
    await sync()
    expect((await readIndex()).snapshots).toHaveLength(2)
    expect(files.has(snapshot.file)).toBe(true)
  })
  it("preserves more than 100 renamed snapshots when a new automatic snapshot is uploaded", async () => {
    await saveWebdavSettings(connection, 1)
    const snapshots: WebdavSnapshot[] = []
    for (let i = 0; i < 101; i++) {
      await seed(`ARCHIVE ${i}`)
      const blob = await createBackup()
      const backup = await readBackup(blob)
      const id = crypto.randomUUID()
      const file = `oh-my-tab-snapshot-${id}.zip`
      const hash = await contentHash(backup.config, backup.image)
      files.set(file, { blob, etag: `"archive-${i}"` })
      snapshots.unshift({
        id,
        file,
        hash,
        deviceId: "archive",
        uploadedAt: Date.now(),
        name: `Saved ${i}`,
        protected: true,
        change: null,
      })
    }
    files.set("oh-my-tab-sync.json", {
      blob: new Blob([
        JSON.stringify({
          version: 1,
          snapshotLimit: 1,
          snapshots,
          garbage: [],
        }),
      ]),
      etag: '"archives"',
    })
    await sync()
    await seed("NEXT")
    await sync()
    const result = (await readWebdavHistory()).snapshots
    expect(result).toHaveLength(102)
    expect(result.filter((snapshot) => snapshot.protected)).toHaveLength(101)
    expect(snapshots.every((snapshot) => files.has(snapshot.file))).toBe(true)
  })
})
