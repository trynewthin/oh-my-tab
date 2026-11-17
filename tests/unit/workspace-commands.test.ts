import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import {
  DexieEntryRepository,
  EntryDatabase,
} from "@/lib/data/dexie-repository"
import { WorkspaceService, configEntries } from "@/lib/data/workspace"
import { defaultConfig } from "@/lib/data/config"
import type { WorkspaceCommand } from "@/lib/data/commands"
import { createCatalogComponent } from "@/lib/grid/factory"
import { cacheDeletionPlan } from "@/lib/data/maintenance"
import { STORAGE_VERSION } from "@/lib/data-version"

let database: EntryDatabase
let repository: DexieEntryRepository
let service: WorkspaceService
beforeEach(async () => {
  database = new EntryDatabase(`commands-${crypto.randomUUID()}`)
  repository = new DexieEntryRepository(database)
  service = new WorkspaceService(repository)
  await service.initialize()
})
afterEach(async () => {
  vi.restoreAllMocks()
  await database.delete()
})
async function request(command: WorkspaceCommand) {
  return {
    command,
    requestId: crypto.randomUUID(),
    issuedAt: Date.now(),
    expectedRevision: (await service.readSections([])).revision,
  }
}

describe("domain transactions", () => {
  it("commits a garden widget and shared garden together, with rollback and an idempotent retry", async () => {
    const config = defaultConfig()
    const widget = createCatalogComponent("ecosystem")
    if (widget.kind !== "ecosystem") throw new Error("invalid fixture")
    config.grid.items = [widget]
    await service.replace({
      config,
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expectedRevision: (await service.readSections([])).revision,
    })
    const input = await request({
      type: "garden.update-widget",
      widget: { ...widget, name: "Renamed garden" },
      garden: { ...config.garden, points: 12 },
    })
    const before = await repository.read()
    vi.spyOn(database.metadata, "bulkPut").mockRejectedValueOnce(
      new Error("disk full")
    )
    await expect(service.execute(input)).rejects.toThrow("disk full")
    expect(await repository.read()).toEqual(before)
    const receipt = await service.execute(input)
    expect(receipt.documentRevisions).toHaveProperty("garden")
    expect(receipt.documentRevisions).toHaveProperty("grid")
    expect((await service.read()).config).toMatchObject({
      garden: { points: 12 },
      grid: { items: [{ name: "Renamed garden" }] },
    })
    expect(await service.execute(input)).toEqual(receipt)
  })

  it("previews and repairs damaged local documents without altering the supplied backup", async () => {
    await repository.mutate(() => ({
      updates: { "omt.tab-grid": "broken JSON" },
      result: undefined,
    }))
    const config = defaultConfig()
    const original = structuredClone(config)
    const preview = await service.previewRestore({ config })
    expect(preview.changedSections).toContain("grid")
    await service.applyRestore(preview, {
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
    })
    expect((await service.read()).config.grid.items).toEqual([])
    expect(config).toEqual(original)
    expect(preview.config).toEqual(original)
  })

  it("preserves future envelopes while initializing missing documents", async () => {
    const future = {
      "omt.theme-mode": JSON.stringify({
        state: { theme: "dark", future: true },
        version: STORAGE_VERSION + 1,
      }),
      "future:data": { kept: true },
    }
    await repository.mutate(() => ({
      updates: future,
      remove: ["omt.tab-grid"],
      result: undefined,
    }))
    expect(await service.initialize()).toEqual(["grid"])
    const before = await repository.read()
    expect(before["omt.theme-mode"]).toBe(future["omt.theme-mode"])
    await expect(service.capture()).rejects.toMatchObject({
      code: "UNSUPPORTED_VERSION",
    })
    await expect(
      service.execute(await request({ type: "theme.set", theme: "dark" }))
    ).rejects.toMatchObject({ code: "UNSUPPORTED_VERSION" })
    expect(await repository.read()).toEqual(before)
  })

  it.each([
    { requestId: 42 },
    { issuedAt: 1.5 },
    { issuedAt: Date.now() - 172800000 },
    { expectedRevision: 4 },
  ])(
    "rejects invalid write metadata before changing data (%j)",
    async (invalid) => {
      const before = await repository.read()
      const input = {
        ...(await request({ type: "theme.set", theme: "dark" })),
        ...invalid,
      }
      await expect(
        service.execute(input as Parameters<WorkspaceService["execute"]>[0])
      ).rejects.toMatchObject({ code: "VALIDATION" })
      expect(await repository.read()).toEqual(before)
    }
  )

  it("isolates returned views from the service defaults and rejects missing resources", async () => {
    const missingRepository = new DexieEntryRepository(
      new EntryDatabase(`empty-${crypto.randomUUID()}`)
    )
    try {
      const emptyService = new WorkspaceService(missingRepository)
      const view = await emptyService.readSections(["home"])
      view.data.home.text = "mutated consumer view"
      expect((await emptyService.readSections(["home"])).data.home.text).toBe(
        defaultConfig().home.text
      )
    } finally {
      await missingRepository.database.delete()
    }
    const before = await repository.read()
    await expect(
      service.execute(
        await request({
          type: "settings.patch",
          patch: { backgroundImage: "asset:missing" },
        })
      )
    ).rejects.toMatchObject({ code: "MISSING_ASSET" })
    expect(await repository.read()).toEqual(before)
  })
})

describe("resource references", () => {
  it("protects rescue assets and rechecks active references inside the cleanup transaction", async () => {
    const config = defaultConfig()
    const source = {
      ...configEntries(config),
      "asset:rescue": { createdAt: 1 },
      "asset:next": { createdAt: 1 },
      "asset:orphan": { createdAt: 1 },
      "rescue:omt.home-settings": JSON.stringify({
        state: { backgroundImage: "asset:rescue" },
      }),
      "cache:icon": "old",
    }
    await repository.mutate(() => ({ updates: source, result: undefined }))
    expect(cacheDeletionPlan(await repository.read()).remove).toContain(
      "asset:next"
    )
    config.home.backgroundImage = "asset:next"
    await repository.mutate(() => ({
      updates: configEntries(config),
      result: undefined,
    }))
    await repository.mutate((entries) => ({
      ...cacheDeletionPlan(entries),
      result: undefined,
    }))
    const retained = await repository.read()
    expect(retained["asset:next"]).toBeTruthy()
    expect(retained["asset:rescue"]).toBeTruthy()
    expect(retained["asset:orphan"]).toBeUndefined()
    expect(retained["cache:icon"]).toBeUndefined()
  })
})
