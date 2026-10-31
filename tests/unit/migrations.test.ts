import { readBackup, restoreBackup, createBackup } from "@/application/backup"
import { encodeConfig } from "@/lib/migrations/legacy-config"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import * as storage from "@/lib/storage"
import { CONFIG_VERSION, STORAGE_VERSION } from "@/lib/data-version"
import { migrateStoredData } from "@/lib/migrations/storage"
import { migrateConfig } from "@/lib/migrations/v2"
import * as conversions from "@/lib/migrations/v2"
import {
  snapshot,
  validateConfig,
  importConfig,
} from "@/application/config-transfer"
import { rehydrateData } from "@/application/hydrate"
import { createCatalogComponent } from "@/lib/grid/factory"
import { validGridItem } from "@/lib/grid/validation"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { legacyLocalStorage } from "./setup"
import { usePrivacyStore } from "@/stores/privacy-store"
import { sanitizeTabAppearance } from "@/lib/tab-appearance"

const saved = (state: unknown, version = 0) =>
  JSON.stringify({ state, version })
const now = 1_800_000_000_000
const oldPlant = {
  slot: 4,
  plantedAt: now - 7200000,
  species: "flowers",
  name: "未命名植物",
}
function oldGrid() {
  const timer = { ...createCatalogComponent("pomodoro") } as Record<
    string,
    unknown
  >
  delete timer.breakMinutes
  delete timer.loop
  delete timer.phase
  return {
    items: [
      { id: "retired", kind: "search-full" },
      timer,
      {
        ...createCatalogComponent("ecosystem"),
        plants: [oldPlant],
        points: 8,
        pointsUpdatedAt: now - 3600000,
        album: [oldPlant],
      },
    ],
    layouts: { 16: { retired: { x: 0, y: 0 } } },
  }
}
async function envelope(key: string) {
  return JSON.parse((await storage.readEntries([key]))[key] as string)
}
beforeEach(async () => {
  await storage.flushStorage().catch(() => {})
  await storage.clearAllData()
  legacyLocalStorage.clear()
  vi.spyOn(Date, "now").mockReturnValue(now)
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
})

describe("committed local migrations", () => {
  it.each([
    [0, "large", "small"],
    [1, "medium", "wide"],
    [4, "large", "small"],
    [0, "small", "small"],
    [1, "wide", "wide"],
  ] as const)(
    "migrates %s legacy countdown events with size %s to %s without losing cards or positions",
    async (count, size, expectedSize) => {
      const events = Array.from({ length: count }, (_, index) => ({
        id: `event-${index}`,
        title: `Event ${index}`,
        date: "2026-12-31",
      }))
      const countdown = {
        ...createCatalogComponent("countdown"),
        id: "countdown",
        size,
        events,
      } as Record<string, unknown>
      delete countdown.event
      const other = {
        ...createCatalogComponent("calendar"),
        id: "countdown:countdown:1",
      }
      const layouts = { 16: { countdown: { x: 4, y: 2 } } }
      await storage.writeEntries({
        "omt.tab-grid": saved({ items: [countdown, other], layouts }, 1),
      })

      await rehydrateData()

      const grid = (await envelope("omt.tab-grid")).state
      const cards = grid.items.filter(
        (item: { kind: string }) => item.kind === "countdown"
      )
      expect(cards).toHaveLength(Math.max(1, count))
      expect(cards.map((item: { event: unknown }) => item.event)).toEqual(
        count ? events.map(({ title, date }) => ({ title, date })) : [null]
      )
      expect(cards[0]).toMatchObject({ id: "countdown", size: expectedSize })
      expect(cards.every((item: object) => !("events" in item))).toBe(true)
      expect(grid.items).toContainEqual(other)
      expect(
        new Set(grid.items.map((item: { id: string }) => item.id)).size
      ).toBe(grid.items.length)
      expect(grid.layouts).toEqual(layouts)
      expect(grid.items.every(validGridItem)).toBe(true)
      const before = await storage.allEntries()
      await rehydrateData()
      expect(await storage.allEntries()).toEqual(before)
    }
  )
  it.each([null, { title: "KEEP", date: "invalid" }])(
    "preserves raw storage when a legacy countdown event is invalid: %j",
    async (event) => {
      const countdown = {
        ...createCatalogComponent("countdown"),
        events: [event],
      } as Record<string, unknown>
      delete countdown.event
      const raw = saved({ items: [countdown], layouts: {} }, 1)
      legacyLocalStorage.set("omt.tab-grid", raw)
      const before = await storage.allEntries()

      await expect(rehydrateData()).rejects.toThrow()

      expect(await storage.allEntries()).toEqual(before)
      expect(legacyLocalStorage.get("omt.tab-grid")).toBe(raw)
    }
  )
  it("upgrades the version 3 development profile with version 1 privacy without losing data", async () => {
    const legacyAppearance = { padding: 12, fontSize: 14, iconSize: 32 }
    const tabAppearance = sanitizeTabAppearance(legacyAppearance)
    expect(tabAppearance).toMatchObject({
      paddingX: 12,
      paddingY: 12,
      fontSize: 14,
      iconScale: 114,
    })
    expect(tabAppearance).not.toHaveProperty("padding")
    expect(tabAppearance).not.toHaveProperty("iconSize")
    const plant = { ...oldPlant, seed: 123, appearanceVersion: 2, name: "KEEP" }
    const pot = { ...createCatalogComponent("ecosystem"), plants: [plant] }
    const garden = {
      points: 19,
      pointsUpdatedAt: now,
      initialized: true,
      album: [plant],
    }
    await storage.writeEntries({
      "omt.migrations": 3,
      "omt.home-settings": saved(
        { text: "KEEP", tabAppearance: legacyAppearance },
        3
      ),
      "omt.tab-grid": saved({ items: [pot], layouts: {} }, 3),
      "omt.garden": saved(garden, 3),
      "omt.onboarding": saved({ seen: true }, 3),
      "omt.theme-mode": saved({ theme: "dark" }, 3),
      "omt.search-engines": saved(snapshot().search, 3),
      "omt.privacy": saved(
        { suggestions: true, icons: true, browserSearch: false },
        1
      ),
    })
    await rehydrateData()
    expect(snapshot().home).toMatchObject({ text: "KEEP", tabAppearance })
    expect(snapshot().theme.theme).toBe("dark")
    expect(snapshot().garden).toMatchObject({
      points: 19,
      pointsUpdatedAt: now,
    })
    const migratedPlant = { ...plant, appearance: "varied" }
    delete (migratedPlant as Partial<typeof plant>).appearanceVersion
    expect(snapshot().grid.items).toEqual([{ ...pot, plants: [migratedPlant] }])
    expect(snapshot().garden.album).toEqual([migratedPlant])
    expect(usePrivacyStore.getState()).toMatchObject({
      suggestions: true,
      icons: true,
      browserSearch: false,
    })
    for (const key of [...storage.DATA_KEYS, "omt.privacy"])
      expect((await envelope(key)).version).toBe(STORAGE_VERSION)
    expect(
      (await storage.readEntries(["omt.migrations"]))["omt.migrations"]
    ).toBe(STORAGE_VERSION)
    useHomeSettingsStore.getState().setText("EDITED")
    await storage.flushStorage()
    expect((await envelope("omt.home-settings")).state.tabAppearance).toEqual(
      tabAppearance
    )
    const before = await storage.allEntries()
    await rehydrateData()
    expect(await storage.allEntries()).toEqual(before)
  })
  it.each(["http:", "chrome-extension:"])(
    "preserves v1.5.7 scale and columns, then skips conversion with %s storage",
    async (protocol) => {
      const entries: Record<string, unknown> = {}
      vi.stubGlobal("location", { protocol })
      if (protocol === "chrome-extension:")
        vi.stubGlobal("chrome", {
          storage: {
            local: {
              get: async (keys: string[] | null) =>
                Object.fromEntries(
                  (keys ?? Object.keys(entries)).map((key) => [
                    key,
                    entries[key],
                  ])
                ),
              set: async (values: Record<string, unknown>) => {
                Object.assign(entries, values)
              },
            },
          },
        })
      await storage.writeEntries({
        "omt.home-settings": saved({
          gridScale: 1.8,
          wideGridColumns: 10,
          narrowGridColumns: 8,
        }),
        "omt.tab-grid": saved({ items: [], layouts: { 40: {} } }, 1),
      })
      const convert = vi.spyOn(conversions, "migrateHome")
      await rehydrateData()
      expect(convert).toHaveBeenCalledTimes(1)
      expect((await envelope("omt.home-settings")).state).toMatchObject({
        gridScale: 1.8,
        wideGridColumns: 10,
        narrowGridColumns: 8,
      })
      const before = await storage.readEntries([
        ...storage.DATA_KEYS,
        "omt.revision",
      ])
      await rehydrateData()
      expect(convert).toHaveBeenCalledTimes(1)
      expect(await storage.readEntries(Object.keys(before))).toEqual(before)
      expect(snapshot().home.gridScale).toBe(1.8)
      expect(snapshot().grid.layouts[40]).toEqual({})
    }
  )
  it("reads current data without calling historical converters", async () => {
    const config = validateConfig(JSON.parse(JSON.stringify(snapshot())))
    await importConfig(config, await storage.storageRevision())
    const convert = vi.spyOn(conversions, "migrateHome")
    const before = await storage.readEntries([
      ...storage.DATA_KEYS,
      "omt.revision",
    ])
    await rehydrateData()
    await rehydrateData()
    expect(convert).not.toHaveBeenCalled()
    expect(await storage.readEntries(Object.keys(before))).toEqual(before)
  })
  it.each([0, 1])(
    "migrates version %s records despite a completed marker without changing current records",
    async (version) => {
      await migrateStoredData()
      const theme = saved({ mode: "dark" }, STORAGE_VERSION)
      await storage.writeEntries({
        "omt.home-settings": saved(
          { text: "KEEP", gridScale: 1.8, effectStyle: "particles" },
          version
        ),
        "omt.privacy": saved(
          { suggestions: true, icons: true, browserSearch: false },
          version
        ),
        "omt.theme-mode": theme,
      })
      const garden = await envelope("omt.garden")
      legacyLocalStorage.set("omt.locale", saved({ locale: "en" }))
      await rehydrateData()
      expect(await envelope("omt.home-settings")).toMatchObject({
        version: STORAGE_VERSION,
        state: { text: "KEEP", gridScale: 1.8, tabTexture: "particles" },
      })
      expect(useHomeSettingsStore.getState()).toMatchObject({
        text: "KEEP",
        gridScale: 1.8,
        tabTexture: "particles",
      })
      expect(await envelope("omt.privacy")).toEqual({
        version: STORAGE_VERSION,
        state: {
          suggestions: version !== 0,
          icons: true,
          browserSearch: false,
        },
      })
      expect(usePrivacyStore.getState()).toMatchObject({
        suggestions: version !== 0,
        icons: true,
        browserSearch: false,
      })
      expect(await envelope("omt.garden")).toEqual(garden)
      expect(
        await storage.readEntries([
          "omt.theme-mode",
          "omt.locale",
          "omt.migrations",
        ])
      ).toEqual({
        "omt.theme-mode": theme,
        "omt.locale": undefined,
        "omt.migrations": STORAGE_VERSION,
      })
      const before = await storage.allEntries()
      await rehydrateData()
      expect(await storage.allEntries()).toEqual(before)
    }
  )
  it.each([
    saved({ text: "UNSUPPORTED" }, STORAGE_VERSION + 1),
    saved({ text: "INVALID" }, -1),
    saved({ text: "INVALID" }, 0.5),
    saved([], STORAGE_VERSION),
    "{invalid json",
  ])(
    "rejects invalid or future records after migration completes",
    async (raw) => {
      await migrateStoredData()
      await storage.writeEntries({
        "omt.home-settings": saved({ text: "KEEP" }),
        "omt.privacy": raw,
      })
      const before = await storage.allEntries()
      await expect(rehydrateData()).rejects.toThrow()
      expect(await storage.allEntries()).toEqual(before)
    }
  )
  it("commits fields, shared garden, images and versions before hydration, then skips conversion", async () => {
    legacyLocalStorage.set(
      "omt.home-settings",
      saved({
        effectStyle: "particles",
        burningEntrance: true,
        gridMode: "wide",
        backgroundType: "explore",
        backgroundImage: "data:image/png;base64,AP8=",
      })
    )
    legacyLocalStorage.set("omt.tab-grid", saved(oldGrid(), 1))
    legacyLocalStorage.set(
      "omt.privacy",
      saved({ suggestions: true, icons: true })
    )
    await storage.writeEntries({
      "asset:old": new Blob([new Uint8Array([0, 255])], { type: "image/png" }),
    })
    await migrateStoredData()
    const home = await envelope("omt.home-settings")
    expect(home.version).toBe(STORAGE_VERSION)
    expect(home.state).toMatchObject({
      tabTexture: "particles",
      transitionsEnabled: true,
      backgroundType: "solid",
      layoutMode: "traditional",
    })
    expect(home.state).not.toHaveProperty("effectStyle")
    expect(home.state).not.toHaveProperty("burningEntrance")
    expect(home.state).not.toHaveProperty("gridMode")
    expect(home.state.backgroundImage).toMatch(/^asset:/)
    expect(
      new Uint8Array(
        await (await storage.getAsset(home.state.backgroundImage)).arrayBuffer()
      )
    ).toEqual(new Uint8Array([0, 255]))
    expect(
      new Uint8Array(await (await storage.getAsset("asset:old")).arrayBuffer())
    ).toEqual(new Uint8Array([0, 255]))
    const grid = (await envelope("omt.tab-grid")).state
    expect(grid.items).toHaveLength(2)
    expect(grid.items.every(validGridItem)).toBe(true)
    expect(grid.layouts[16]).toEqual({})
    expect(grid.items[0]).toMatchObject({
      breakMinutes: 0,
      loop: false,
      phase: "focus",
    })
    expect(grid.items[1]).not.toHaveProperty("points")
    expect(grid.items[1]).not.toHaveProperty("album")
    expect(grid.items[1].plants[0]).toMatchObject({
      appearance: "classic",
      seed: (oldPlant.plantedAt + 4 * 997) >>> 0,
    })
    expect(grid.items[1].plants[0]).not.toHaveProperty("name")
    expect((await envelope("omt.garden")).state).toMatchObject({
      initialized: true,
      points: 9,
      pointsUpdatedAt: now,
    })
    expect((await envelope("omt.garden")).state.album).toHaveLength(1)
    expect((await envelope("omt.privacy")).state).toEqual({
      suggestions: false,
      icons: true,
      browserSearch: true,
    })
    expect(legacyLocalStorage.size).toBe(0)
    const before = await storage.readEntries([
      ...storage.DATA_KEYS,
      ...storage.DEVICE_KEYS,
      "omt.migrations",
      "omt.revision",
    ])
    const writes = vi.spyOn(storage, "writeEntries")
    await migrateStoredData()
    await rehydrateData()
    expect(writes).not.toHaveBeenCalled()
    expect(await storage.readEntries(Object.keys(before))).toEqual(before)
    expect(useHomeSettingsStore.getState().tabTexture).toBe("particles")
    await storage.clearAllData()
    await migrateStoredData()
    expect(
      (await storage.readEntries(["omt.home-settings"]))["omt.home-settings"]
    ).toBeUndefined()
  })
  it("preserves already granted v1 privacy choices", async () => {
    await storage.writeEntries({
      "omt.privacy": saved(
        { suggestions: true, icons: false, browserSearch: false },
        1
      ),
    })
    await migrateStoredData()
    expect((await envelope("omt.privacy")).state).toEqual({
      suggestions: true,
      icons: false,
      browserSearch: false,
    })
  })
  it("does not resurrect a removed connection or overwrite current data from localStorage", async () => {
    legacyLocalStorage.set(
      "omt.webdav",
      JSON.stringify({ url: "https://example.com/", username: "old" })
    )
    legacyLocalStorage.set("omt.home-settings", saved({ text: "OLD" }))
    await storage.writeEntries({
      "omt.webdav": null,
      "omt.home-settings": saved({ text: "CURRENT" }),
    })
    await migrateStoredData()
    expect((await envelope("omt.home-settings")).state.text).toBe("CURRENT")
    expect((await storage.readEntries(["omt.webdav"]))["omt.webdav"]).toBeNull()
    expect(legacyLocalStorage.size).toBe(0)
  })
  it("keeps the source and no completion marker when persistence fails, and can retry", async () => {
    const source = saved({
      effectStyle: "none",
      backgroundImage: "data:image/png;base64,AP8=",
    })
    legacyLocalStorage.set("omt.home-settings", source)
    const write = vi
      .spyOn(storage, "writeEntries")
      .mockRejectedValueOnce(new Error("disk full"))
    await expect(migrateStoredData()).rejects.toThrow("disk full")
    expect(legacyLocalStorage.get("omt.home-settings")).toBe(source)
    expect(
      Object.keys(await storage.allEntries()).some((key) =>
        key.startsWith("asset:")
      )
    ).toBe(false)
    expect(
      await storage.readEntries(["omt.home-settings", "omt.migrations"])
    ).toEqual({ "omt.home-settings": undefined, "omt.migrations": undefined })
    write.mockRestore()
    await migrateStoredData()
    expect((await envelope("omt.home-settings")).state.tabTexture).toBe("none")
    expect(legacyLocalStorage.size).toBe(0)
  })
  it("retries interrupted cleanup without repeating garden aggregation", async () => {
    legacyLocalStorage.set("omt.tab-grid", saved(oldGrid()))
    vi.spyOn(localStorage, "removeItem").mockImplementationOnce(() => {
      throw new Error("cleanup interrupted")
    })
    await expect(migrateStoredData()).rejects.toThrow("cleanup interrupted")
    const garden = await envelope("omt.garden")
    expect(
      (await storage.readEntries(["omt.migrations"]))["omt.migrations"]
    ).toBeUndefined()
    vi.spyOn(Date, "now").mockReturnValue(now + 36000000)
    await migrateStoredData()
    expect(await envelope("omt.garden")).toEqual(garden)
    expect(legacyLocalStorage.size).toBe(0)
  })
  it("serializes concurrent startup migrations", async () => {
    legacyLocalStorage.set(
      "omt.home-settings",
      saved({ effectStyle: "particles" })
    )
    const write = vi.spyOn(storage, "writeEntries")
    await Promise.all([
      migrateStoredData(),
      migrateStoredData(),
      migrateStoredData(),
    ])
    expect(
      write.mock.calls.filter(([values]) => "omt.home-settings" in values)
    ).toHaveLength(1)
  })
  it("rejects a concurrent data edit instead of overwriting it", async () => {
    legacyLocalStorage.set(
      "omt.home-settings",
      saved({ effectStyle: "particles" })
    )
    const original = storage.writeEntries
    const concurrent = saved({ text: "OTHER TAB" })
    vi.spyOn(storage, "writeEntries").mockImplementationOnce(
      async (...args) => {
        await original({ "omt.home-settings": concurrent })
        await original(...args)
      }
    )
    await expect(migrateStoredData()).rejects.toThrow(/更新/)
    expect(
      (await storage.readEntries(["omt.home-settings"]))["omt.home-settings"]
    ).toBe(concurrent)
    expect(legacyLocalStorage.has("omt.home-settings")).toBe(true)
    expect(
      (await storage.readEntries(["omt.migrations"]))["omt.migrations"]
    ).toBeUndefined()
  })
  it.each([
    saved({ items: [{ kind: "unknown" }], layouts: {} }),
    saved({ items: [], layouts: {} }, STORAGE_VERSION + 1),
  ])("does not mark invalid or future data migrated", async (raw) => {
    await storage.writeEntries({ "omt.tab-grid": raw })
    await expect(migrateStoredData()).rejects.toThrow()
    expect((await storage.readEntries(["omt.tab-grid"]))["omt.tab-grid"]).toBe(
      raw
    )
    expect(
      (await storage.readEntries(["omt.migrations"]))["omt.migrations"]
    ).toBeUndefined()
  })
})

describe("backup migration boundary", () => {
  it.each([1, 2, 3])(
    "preserves every legacy countdown event when importing format %s",
    (version) => {
      const source = JSON.parse(JSON.stringify(snapshot()))
      source.version = version
      source.home.backgroundImage = null
      const countdown = {
        ...createCatalogComponent("countdown"),
        events: [
          { id: "first", title: "First", date: "2026-12-01" },
          { id: "second", title: "Second", date: "2026-12-31" },
        ],
      } as Record<string, unknown>
      delete countdown.event
      source.grid = { items: [countdown], layouts: {} }
      const before = structuredClone(source)

      const config = validateConfig(source)

      expect(config.grid.items).toHaveLength(2)
      expect(config.grid.items).toMatchObject([
        { id: countdown.id, event: { title: "First", date: "2026-12-01" } },
        { event: { title: "Second", date: "2026-12-31" } },
      ])
      expect(source).toEqual(before)
    }
  )
  it.each([1, 2, 3])(
    "preserves plants when importing historical format %s",
    async (version) => {
      const source = JSON.parse(JSON.stringify(snapshot()))
      source.version = version
      source.home.backgroundImage = null
      const legacyAppearance = { padding: 12, fontSize: 14 }
      source.home.tabAppearance = legacyAppearance
      const appearance = sanitizeTabAppearance(legacyAppearance)
      expect(appearance).toMatchObject({
        paddingX: 12,
        paddingY: 12,
        fontSize: 14,
      })
      const plants = [
        { ...oldPlant, slot: 0 },
        {
          ...oldPlant,
          slot: 1,
          seed: 123,
          appearanceVersion: 2,
          name: "MY PLANT",
        },
      ]
      source.grid.items = [{ ...createCatalogComponent("ecosystem"), plants }]
      source.grid.layouts = {}
      source.garden = {
        points: 7,
        pointsUpdatedAt: now,
        initialized: true,
        album: plants,
      }
      const converted = validateConfig(source)
      expect(converted.home.tabAppearance).toEqual(appearance)
      const plant = converted.grid.items[0]
      if (plant.kind !== "ecosystem") throw new Error("Expected ecosystem")
      expect(plant.plants[0]).toMatchObject({
        appearance: "classic",
        seed: oldPlant.plantedAt >>> 0,
      })
      expect(plant.plants[1]).toMatchObject({
        appearance: "varied",
        seed: 123,
        name: "MY PLANT",
      })
      expect(plant.plants[1]).not.toHaveProperty("appearanceVersion")
      expect(converted.garden.album).toEqual(plant.plants)
      await importConfig(converted, await storage.storageRevision())
      await rehydrateData()
      expect(snapshot().garden).toEqual(converted.garden)
      expect(snapshot().grid.items).toEqual(converted.grid.items)
      expect(snapshot().home.tabAppearance).toEqual(appearance)
    }
  )
  it.each([384, 1024])(
    "persists the displayed legacy %s-pixel artwork in the current canvas shape",
    async (length) => {
      const old = JSON.parse(JSON.stringify(snapshot()))
      old.version = 1
      old.home.backgroundImage = null
      const canvas = {
        ...createCatalogComponent("dot-canvas"),
        pixels: Array<string>(length).fill(""),
      } as Record<string, unknown>
      const pixels = canvas.pixels as string[]
      pixels[0] = "#123456"
      pixels[length - 1] = "#abcdef"
      delete canvas.pixelColumns
      old.grid = { items: [canvas], layouts: {} }
      const config = validateConfig(old)
      const item = config.grid.items[0]
      expect(item.kind).toBe("dot-canvas")
      if (item.kind !== "dot-canvas") throw new Error("Expected canvas")
      expect(item.pixelColumns).toBe(24)
      expect(item.pixels).toHaveLength(576)
      expect(item.pixels[length === 384 ? 96 : 0]).toBe("#123456")
      expect(item.pixels[length === 384 ? 479 : 575]).toBe("#abcdef")
      await importConfig(config, await storage.storageRevision())
      const before = await envelope("omt.tab-grid")
      await rehydrateData()
      expect(await envelope("omt.tab-grid")).toEqual(before)
      expect(
        validateConfig(JSON.parse(JSON.stringify(snapshot()))).grid.items
      ).toEqual(config.grid.items)
    }
  )
  it("keeps current wide canvas pixels and scaling unchanged during import", () => {
    const source = JSON.parse(JSON.stringify(snapshot()))
    source.home.backgroundImage = null
    source.home.gridScale = 1.6
    source.grid.items = [createCatalogComponent("dot-canvas", "wide")]
    const canvas = source.grid.items[0]
    canvas.pixels[1149] = "#abcdef"
    expect(validateConfig(source)).toEqual(source)
    source.version = 1
    expect(validateConfig(source).grid.items).toEqual(source.grid.items)
    expect(validateConfig(source).home.gridScale).toBe(1.6)
  })
  it("converts old exports without mutating the source and immediately imports the current version", async () => {
    const old = JSON.parse(JSON.stringify(snapshot()))
    old.version = 1
    old.home.backgroundImage = null
    delete old.garden
    delete old.home.tabTexture
    old.home.effectStyle = "particles"
    old.grid = oldGrid()
    const source = structuredClone(old)
    const config = validateConfig(old)
    expect(old).toEqual(source)
    expect(config.version).toBe(CONFIG_VERSION)
    expect(config.garden.pointsUpdatedAt).toBe(now)
    expect(config.garden.points).toBe(9)
    expect(config.home.tabTexture).toBe("particles")
    expect(config.home).not.toHaveProperty("effectStyle")
    vi.spyOn(Date, "now").mockReturnValue(now + 10000)
    expect(migrateConfig(config)).toEqual(config)
    await importConfig(config, await storage.storageRevision())
    for (const key of storage.DATA_KEYS)
      expect((await envelope(key)).version).toBe(STORAGE_VERSION)
    await rehydrateData()
    expect(snapshot().grid.items).toEqual(config.grid.items)
  })
  it("converts inline images in text backups once and exports only the current ZIP format", async () => {
    vi.stubGlobal("createImageBitmap", async () => ({ close() {} }))
    const old = JSON.parse(JSON.stringify(snapshot()))
    old.version = 1
    old.home.backgroundImage = "data:image/png;base64,AP8="
    const file = new Blob([await encodeConfig(old)])
    const backup = await readBackup(file)
    expect(backup.config.version).toBe(CONFIG_VERSION)
    expect(backup.config.home.backgroundImage).toBeNull()
    expect(new Uint8Array(await backup.image!.arrayBuffer())).toEqual(
      new Uint8Array([0, 255])
    )
    await restoreBackup(backup, await storage.storageRevision())
    expect((await envelope("omt.home-settings")).state.backgroundImage).toMatch(
      /^asset:/
    )
    const exported = await readBackup(await createBackup())
    expect(exported.config.version).toBe(CONFIG_VERSION)
    expect(exported.config.home.backgroundImage).toBeNull()
    expect(await exported.image!.arrayBuffer()).toEqual(
      await backup.image!.arrayBuffer()
    )
  })
  it("rejects incomplete current-format backups instead of treating them as old data", () => {
    const config = JSON.parse(JSON.stringify(snapshot()))
    delete config.home.searchShortcuts
    expect(() => validateConfig(config)).toThrow()
  })
})
