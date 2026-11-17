import { afterEach, describe, expect, it, vi } from "vitest"
import { defaultConfig } from "@/lib/data/config"
import {
  DexieEntryRepository,
  EntryDatabase,
} from "@/lib/data/dexie-repository"
import { WorkspaceService, configEntries } from "@/lib/data/workspace"
import { STORAGE_VERSION } from "@/lib/data-version"
import { readLegacyEntries } from "@/lib/data/legacy-storage"

const databases: EntryDatabase[] = []
const subscriptions: (() => void)[] = []
const repo = (name = `test-workspace-${crypto.randomUUID()}`) => {
  const database = new EntryDatabase(name)
  databases.push(database)
  return new DexieEntryRepository(database)
}
afterEach(async () => {
  subscriptions.splice(0).forEach((unsubscribe) => unsubscribe())
  vi.restoreAllMocks()
  const names = new Set(databases.map((database) => database.name))
  databases.forEach((database) => database.close())
  databases.length = 0
  for (const name of names) await new EntryDatabase(name).delete()
})
const request = (config = defaultConfig(), expectedRevision?: string) => ({
  requestId: crypto.randomUUID(),
  issuedAt: Date.now(),
  expectedRevision,
  config,
})

describe("workspace transactions", () => {
  it("allows only one writer at the same revision across independent connections", async () => {
    const first = repo()
    const second = repo(first.database.name)
    const a = new WorkspaceService(first)
    const b = new WorkspaceService(second)
    const config = defaultConfig()
    const base = await a.replace(request(config))
    const next = structuredClone(config)
    next.home.text = "SECOND"
    const results = await Promise.allSettled([
      a.replace(request(config, base.revision)),
      b.replace(request(next, base.revision)),
    ])
    expect(
      results.filter((result) => result.status === "fulfilled")
    ).toHaveLength(1)
    const failure = results.find(
      (result) => result.status === "rejected"
    ) as PromiseRejectedResult
    expect(failure.reason).toMatchObject({ code: "CONFLICT" })
  })

  it("replays an identical request and rejects a different body with the same id", async () => {
    const repository = repo()
    const service = new WorkspaceService(repository)
    const input = request()
    const first = await service.replace(input)
    const before = await repository.read()
    expect(await service.replace(input)).toEqual(first)
    expect(await repository.read()).toEqual(before)
    input.config.home.text = "DIFFERENT"
    await expect(service.replace(input)).rejects.toMatchObject({
      code: "VALIDATION",
    })
    expect(await repository.read()).toEqual(before)
  })

  it("rolls back config, resource, revision and receipt after a late transaction failure", async () => {
    const repository = repo()
    const service = new WorkspaceService(repository)
    const base = await service.replace(request())
    const before = await repository.read()
    vi.spyOn(repository.database.metadata, "bulkPut").mockRejectedValueOnce(
      new Error("quota")
    )
    await expect(
      service.replace({
        ...request(defaultConfig(), base.revision),
        image: new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }),
      })
    ).rejects.toThrow("quota")
    expect(await repository.read()).toEqual(before)
  })

  it("captures one complete revision and keeps image bytes after rows are collected", async () => {
    const repository = repo()
    const service = new WorkspaceService(repository)
    const image = new Blob([new Uint8Array([82, 73, 70, 70])], {
      type: "image/webp",
    })
    const first = await service.replace({ ...request(), image })
    const next = defaultConfig()
    next.home.text = "NEW"
    next.theme.theme = "dark"
    const [captured] = await Promise.all([
      service.capture(),
      service.replace(request(next, first.revision)),
    ])
    expect([defaultConfig().home.text, "NEW"]).toContain(
      captured.config.home.text
    )
    if (captured.revision === first.revision) {
      expect(captured.config.theme.theme).toBe("light")
      expect(captured.image).toBeInstanceOf(Blob)
    } else {
      expect(captured.config.home.text).toBe("NEW")
      expect(captured.config.theme.theme).toBe("dark")
      expect(captured.image).toBeUndefined()
    }
    const exported = await service.capture()
    await repository.mutate((entries) => ({
      updates: {},
      remove: Object.keys(entries),
      result: undefined,
    }))
    expect(exported.config.home.text).toBe("NEW")
    if (captured.image)
      expect(new Uint8Array(await captured.image.arrayBuffer())).toEqual(
        new Uint8Array(await image.arrayBuffer())
      )
  })

  it("rejects a restore bound to a revision before an intervening edit", async () => {
    const service = new WorkspaceService(repo())
    const base = await service.replace(request())
    const preview = await service.previewRestore({ config: defaultConfig() })
    expect(preview.revision).toBe(base.revision)
    const edited = defaultConfig()
    edited.home.text = "KEEP"
    await service.replace(request(edited, base.revision))
    await expect(
      service.applyRestore(preview, {
        requestId: crypto.randomUUID(),
        issuedAt: Date.now(),
      })
    ).rejects.toMatchObject({ code: "CONFLICT" })
    expect((await service.read()).config.home.text).toBe("KEEP")
  })

  it("preserves future envelopes and refuses to overwrite them", async () => {
    const repository = repo()
    const service = new WorkspaceService(repository)
    const current = configEntries(defaultConfig())
    current["omt.home-settings"] = JSON.stringify({
      version: STORAGE_VERSION,
      minReadVersion: STORAGE_VERSION + 1,
      state: defaultConfig().home,
    })
    await repository.mutate(() => ({ updates: current, result: undefined }))
    await expect(service.read()).rejects.toMatchObject({
      code: "UNSUPPORTED_VERSION",
    })
    await expect(service.replace(request())).rejects.toMatchObject({
      code: "UNSUPPORTED_VERSION",
    })
    expect(await repository.read()).toEqual(current)
  })

  it("protects corrupt documents when capturing instead of exporting memory defaults", async () => {
    const repository = repo()
    const service = new WorkspaceService(repository)
    await repository.mutate(() => ({
      updates: { "omt.tab-grid": "broken" },
      result: undefined,
    }))
    await expect(service.capture()).rejects.toMatchObject({
      code: "VALIDATION",
    })
    expect((await repository.read())["omt.tab-grid"]).toBe("broken")
  })

  it("delivers coalesced changes for every affected document across connections", async () => {
    const first = repo()
    const second = repo(first.database.name)
    const keys = new Set<string>()
    subscriptions.push(
      second.subscribe((changed) => changed.forEach((key) => keys.add(key)))
    )
    await first.mutate(() => ({ updates: { a: 1 }, result: undefined }))
    await first.mutate(() => ({ updates: { b: 2 }, result: undefined }))
    await vi.waitFor(() => expect([...keys].sort()).toEqual(["a", "b"]))
  })
})

describe("legacy database cutover", () => {
  it("blocks subsequent writes when the retained extension source changes", async () => {
    const repository = repo()
    await repository.importLegacy(
      async () => ({ "omt.revision": "old-source" }),
      "chrome"
    )
    await repository.verifyLegacyRevision("old-source")
    await repository.mutate(() => ({
      updates: { "omt.revision": "active" },
      result: undefined,
    }))
    await expect(
      repository.verifyLegacyRevision("changed-source")
    ).rejects.toMatchObject({ code: "LEGACY_CHANGED" })
    expect((await repository.read())["omt.revision"]).toBe("active")
  })

  it("copies the old web database intact and fences clients opening its old version", async () => {
    const database = await new Promise<IDBDatabase>((resolve, reject) => {
      const opening = indexedDB.open("oh-my-tab-data", 1)
      opening.onupgradeneeded = () =>
        opening.result.createObjectStore("entries")
      opening.onsuccess = () => resolve(opening.result)
      opening.onerror = () => reject(opening.error)
    })
    const original = JSON.stringify({
      version: STORAGE_VERSION,
      state: { seen: true },
    })
    await new Promise<void>((resolve, reject) => {
      const tx = database.transaction("entries", "readwrite")
      tx.objectStore("entries").put(original, "omt.onboarding")
      tx.oncomplete = () => resolve()
      tx.onerror = () => reject(tx.error)
    })
    database.onversionchange = () => database.close()
    try {
      expect(await readLegacyEntries()).toEqual({ "omt.onboarding": original })
      await expect(
        new Promise((resolve, reject) => {
          const opening = indexedDB.open("oh-my-tab-data", 1)
          opening.onerror = () => reject(opening.error)
          opening.onsuccess = () => {
            opening.result.close()
            resolve(undefined)
          }
        })
      ).rejects.toMatchObject({ name: "VersionError" })
      expect(await readLegacyEntries()).toEqual({ "omt.onboarding": original })
    } finally {
      database.close()
      await new Promise<void>((resolve, reject) => {
        const removal = indexedDB.deleteDatabase("oh-my-tab-data")
        removal.onsuccess = () => resolve()
        removal.onerror = () => reject(removal.error)
      })
    }
  })

  it("retries an interrupted import without changing the retained source", async () => {
    const repository = repo()
    const source = {
      ...configEntries(defaultConfig()),
      "rescue:omt.tab-grid": "bad original",
    }
    const read = vi
      .fn()
      .mockRejectedValueOnce(new Error("interrupted"))
      .mockResolvedValue(source)
    await expect(repository.importLegacy(read)).rejects.toThrow("interrupted")
    expect(await repository.read()).toEqual({})
    expect(
      await repository.database.metadata.get("legacy-import")
    ).toBeUndefined()
    await repository.importLegacy(read)
    expect(await repository.read()).toEqual(source)
    await repository.mutate(() => ({
      updates: { "omt.revision": "new" },
      result: undefined,
    }))
    await repository.importLegacy(read)
    expect(read).toHaveBeenCalledTimes(2)
    expect((await repository.read())["omt.revision"]).toBe("new")
    expect(source["rescue:omt.tab-grid"]).toBe("bad original")
  })

  it("rolls back a failed target copy and imports its resources on retry", async () => {
    const repository = repo()
    const source = {
      "asset:old": {
        createdAt: 1,
        value: new Blob(["raw"], { type: "image/png" }),
      },
    }
    vi.spyOn(repository.database.metadata, "put").mockRejectedValueOnce(
      new Error("disk full")
    )
    await expect(repository.importLegacy(async () => source)).rejects.toThrow(
      "disk full"
    )
    expect(await repository.read()).toEqual({})
    await repository.importLegacy(async () => source)
    const restored = (await repository.read())[
      "asset:old"
    ] as (typeof source)["asset:old"]
    expect(await restored.value.text()).toBe("raw")
  })
  it("detects retained-source edits even when the old client does not bump its revision", async () => {
    const repository = repo()
    const config = defaultConfig()
    const source = configEntries(config)
    await repository.importLegacy(async () => source, "chrome")
    const before = await repository.read()
    await expect(repository.verifyLegacySource(source)).resolves.toBeUndefined()
    config.home.text = "changed by old client"
    await expect(
      repository.verifyLegacySource(configEntries(config))
    ).rejects.toMatchObject({ code: "LEGACY_CHANGED" })
    expect(await repository.read()).toEqual(before)
  })
})
