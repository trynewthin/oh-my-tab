import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { prepareData, rehydrateData } from "@/application/hydrate"
import { saveGardenWidget } from "@/application/garden"
import { createCatalogComponent } from "@/lib/grid/factory"
import { localWorkspace } from "@/lib/data/local-workspace"
import { clearAllData, flushStorage, writeEntries } from "@/lib/storage"
import { defaultConfig } from "@/lib/data/config"
import { STORAGE_VERSION } from "@/lib/data-version"
import { legacyLocalStorage } from "./setup"

let stop: (() => void) | undefined
beforeEach(async () => {
  legacyLocalStorage.clear()
  await flushStorage().catch(() => {})
  await clearAllData()
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), {
      location: { hostname: "localhost", origin: "http://localhost:5173" },
    })
  )
  vi.stubGlobal(
    "document",
    Object.assign(new EventTarget(), { visibilityState: "visible" })
  )
})
afterEach(async () => {
  stop?.()
  stop = undefined
  await flushStorage().catch(() => {})
  vi.unstubAllGlobals()
  legacyLocalStorage.clear()
})

describe("workspace startup", () => {
  it("saves daily check-ins in shared garden data rather than a widget copy", async () => {
    await localWorkspace.initialize()
    const widget = createCatalogComponent("ecosystem")
    if (widget.kind !== "ecosystem") throw new Error("invalid fixture")
    await localWorkspace.execute({
      command: {
        type: "grid.replace",
        grid: { items: [widget], layouts: {}, mockDataVersion: 0 },
      },
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expectedRevision: (await localWorkspace.readSections([])).revision,
    })
    await rehydrateData()
    await saveGardenWidget({
      ...widget,
      points: 7,
      pointsUpdatedAt: Date.now(),
      album: [],
      lastCheckIn: "2026-11-17",
    })
    const { config } = await localWorkspace.read()
    expect(config.garden).toMatchObject({
      points: 7,
      lastCheckIn: "2026-11-17",
    })
    expect(config.grid.items[0]).not.toHaveProperty("lastCheckIn")
  })
  it("seeds the development demo for a fresh workspace after automatic garden migration", async () => {
    stop = await prepareData()
    const { config } = await localWorkspace.read()
    expect(config.grid.items.length).toBeGreaterThan(0)
    expect(config.onboarding.seen).toBe(true)
  })
  it.each(["current", "legacy"])(
    "keeps %s user preferences when a missing grid is initialized",
    async (source) => {
      const home = { ...defaultConfig().home, text: "KEEP MY HOME" }
      const raw = JSON.stringify({
        state: home,
        version: source === "legacy" ? 0 : STORAGE_VERSION,
      })
      if (source === "legacy") legacyLocalStorage.set("omt.home-settings", raw)
      else await writeEntries({ "omt.home-settings": raw }, true)
      stop = await prepareData()
      const { config } = await localWorkspace.read()
      expect(config.home.text).toBe("KEEP MY HOME")
      expect(config.grid.items).toEqual([])
    }
  )
})
