import { beforeEach, describe, expect, it } from "vitest"
import {
  clearAllData,
  drainReadIssues,
  flushStorage,
  storageOptions,
  writeEntries,
} from "@/lib/storage"
import { sanitizeState } from "@/lib/sanitize"
import { STORAGE_VERSION } from "@/lib/data-version"

const storage = storageOptions().storage!

async function writeEnvelope(key: string, envelope: unknown) {
  await writeEntries(
    {
      [key]: typeof envelope === "string" ? envelope : JSON.stringify(envelope),
    },
    false
  )
  await flushStorage()
}

beforeEach(async () => {
  drainReadIssues()
  await clearAllData()
})

describe("tolerant envelope reads", () => {
  it("reads current-version envelopes without issues", async () => {
    await writeEnvelope("omt.theme-mode", {
      state: { theme: "dark" },
      version: STORAGE_VERSION,
    })
    expect(await storage.getItem("omt.theme-mode")).toEqual({
      state: { theme: "dark" },
      version: STORAGE_VERSION,
    })
    expect(drainReadIssues()).toEqual([])
  })

  it("best-effort reads newer envelopes without minReadVersion", async () => {
    await writeEnvelope("omt.theme-mode", {
      state: { theme: "system", futureField: 1 },
      version: STORAGE_VERSION + 1,
    })
    expect(await storage.getItem("omt.theme-mode")).toEqual({
      state: { theme: "system" },
      version: STORAGE_VERSION,
    })
    expect(drainReadIssues()).toEqual([
      { key: "omt.theme-mode", reason: "partial" },
    ])
  })

  it("refuses newer envelopes whose minReadVersion exceeds this client", async () => {
    await writeEnvelope("omt.theme-mode", {
      state: { theme: "dark" },
      version: STORAGE_VERSION + 1,
      minReadVersion: STORAGE_VERSION + 1,
    })
    expect(await storage.getItem("omt.theme-mode")).toBeNull()
    expect(drainReadIssues()).toEqual([
      { key: "omt.theme-mode", reason: "unreadable" },
    ])
  })

  it("sanitizes older envelopes instead of rejecting them", async () => {
    await writeEnvelope("omt.theme-mode", {
      state: { theme: "solarized" },
      version: STORAGE_VERSION - 1,
    })
    expect(await storage.getItem("omt.theme-mode")).toEqual({
      state: { theme: "light" },
      version: STORAGE_VERSION,
    })
    expect(drainReadIssues()).toEqual([
      { key: "omt.theme-mode", reason: "partial" },
    ])
  })

  it("reports malformed payloads as unreadable, never throws", async () => {
    await writeEnvelope("omt.theme-mode", "{ not json")
    await expect(storage.getItem("omt.theme-mode")).resolves.toBeNull()
    expect(drainReadIssues()).toEqual([
      { key: "omt.theme-mode", reason: "unreadable" },
    ])
  })

  it("keeps a bad key from affecting other keys", async () => {
    await writeEnvelope("omt.theme-mode", "{ not json")
    await writeEnvelope("omt.onboarding", {
      state: { seen: true },
      version: STORAGE_VERSION,
    })
    await storage.getItem("omt.theme-mode")
    expect(await storage.getItem("omt.onboarding")).toEqual({
      state: { seen: true },
      version: STORAGE_VERSION,
    })
    expect(drainReadIssues()).toEqual([
      { key: "omt.theme-mode", reason: "unreadable" },
    ])
  })
})

describe("sanitizeState", () => {
  it("rejects non-object state", () => {
    expect(sanitizeState("omt.garden", "nope")).toEqual({ ok: false })
    expect(sanitizeState("omt.garden", [1, 2])).toEqual({ ok: false })
  })

  it("keeps valid garden state", () => {
    const garden = {
      points: 3,
      pointsUpdatedAt: 100,
      album: [],
      initialized: true,
    }
    expect(sanitizeState("omt.garden", garden)).toEqual({
      ok: true,
      state: garden,
      partial: false,
    })
  })

  it("salvages readable garden fields", () => {
    const result = sanitizeState("omt.garden", {
      points: 7,
      pointsUpdatedAt: -1,
      album: ["junk"],
      initialized: true,
      extra: "dropped",
    })
    expect(result).toMatchObject({
      ok: true,
      partial: true,
      state: { points: 7, album: [], initialized: true },
    })
  })

  it("drops invalid theme values", () => {
    expect(sanitizeState("omt.theme-mode", { theme: "neon" })).toEqual({
      ok: true,
      state: { theme: "light" },
      partial: true,
    })
  })

  it("reads unknown keys as partial", () => {
    expect(sanitizeState("omt.future", { anything: true })).toEqual({
      ok: true,
      state: { anything: true },
      partial: true,
    })
  })
})
