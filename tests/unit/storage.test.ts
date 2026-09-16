import { describe, expect, it } from "vitest"
import * as storage from "@/lib/storage"
import { legacyLocalStorage } from "./setup"

const saved = (state: unknown) => JSON.stringify({ state, version: 0 })

describe("storage (IndexedDB backend)", () => {
  it("migrates legacy data, keeps assets lossless, and guards stale writes", async () => {
    legacyLocalStorage.set(
      "omt.home-settings",
      saved({ backgroundImage: null })
    )
    await storage.initializeStorage()
    expect(
      (await storage.readEntries(["omt.home-settings"]))["omt.home-settings"]
    ).toBe(saved({ backgroundImage: null }))
    const blob = new Blob([new Uint8Array([0, 128, 255, 18])], {
      type: "image/png",
    })
    const id = await storage.putAsset(blob)
    expect(await (await storage.getAsset(id)).arrayBuffer()).toEqual(
      await blob.arrayBuffer()
    )
    const revision = await storage.storageRevision()
    await storage.replaceData(
      { "omt.home-settings": "new", "omt.theme-mode": "dark" },
      revision
    )
    await expect(
      storage.replaceData(
        { "omt.home-settings": "stale", "omt.theme-mode": "light" },
        revision
      )
    ).rejects.toThrow(/更新/)
    expect(
      await storage.readEntries(["omt.home-settings", "omt.theme-mode"])
    ).toEqual({
      "omt.home-settings": "new",
      "omt.theme-mode": "dark",
    })
    await storage.flushStorage().catch(() => {})
    await storage.initializeStorage()
    expect(
      (await storage.readEntries(["omt.home-settings"]))["omt.home-settings"],
      "migration never overwrites current data"
    ).toBe("new")
    await storage.editStoredEntries(() => ({
      updates: { "omt.theme-mode": "reset" },
      remove: [id],
    }))
    expect(
      (await storage.readEntries(["omt.theme-mode"]))["omt.theme-mode"]
    ).toBe("reset")
    expect(
      (await storage.readEntries(["omt.home-settings"]))["omt.home-settings"]
    ).toBe("new")
    await expect(storage.getAsset(id)).rejects.toThrow(/缺失/)
  })
})

describe("storage (chrome.storage backend)", () => {
  it("keeps binary assets lossless and restricts access", async () => {
    globalThis.location.protocol = "chrome-extension:"
    const values: Record<string, unknown> = {}
    let access: string | undefined
    ;(globalThis as Record<string, unknown>).chrome = {
      storage: {
        local: {
          get: async (keys: string[] | null) =>
            Object.fromEntries(
              (keys ?? Object.keys(values)).map((key) => [key, values[key]])
            ),
          set: async (data: Record<string, unknown>) => {
            Object.assign(values, JSON.parse(JSON.stringify(data)))
          },
          remove: async (keys: string[]) =>
            keys.forEach((key) => delete values[key]),
          setAccessLevel: async (options: { accessLevel: string }) => {
            access = options.accessLevel
          },
        },
      },
    }
    await storage.initializeStorage()
    expect(access).toBe("TRUSTED_CONTEXTS")
    const blob = new Blob([new Uint8Array([255, 0, 52, 191])], {
      type: "image/webp",
    })
    const id = await storage.putAsset(blob)
    expect((values[id] as { value: string }).value).toMatch(
      /^data:image\/webp;base64,/
    )
    expect(await (await storage.getAsset(id)).arrayBuffer()).toEqual(
      await blob.arrayBuffer()
    )
    const persist = storage.storageOptions().storage
    await persist!.getItem("omt.theme-mode")
    persist!.setItem("omt.theme-mode", {
      state: { theme: "dark" },
      version: 0,
    })
    persist!.setItem("omt.theme-mode", {
      state: { theme: "light" },
      version: 0,
    })
    await storage.flushStorage()
    expect(JSON.parse(values["omt.theme-mode"] as string).state.theme).toBe(
      "light"
    )
    values["omt.theme-mode"] = JSON.stringify({
      state: { theme: "system" },
      version: 0,
    })
    persist!.setItem("omt.theme-mode", {
      state: { theme: "dark" },
      version: 0,
    })
    await expect(storage.flushStorage()).rejects.toThrow(/更新/)
    expect(JSON.parse(values["omt.theme-mode"] as string).state.theme).toBe(
      "system"
    )
    values["omt.home-settings"] = JSON.stringify({
      state: { backgroundImage: id },
    })
    ;(values[id] as { createdAt: number }).createdAt = 1
    values["asset:orphan"] = { createdAt: 1, value: "old" }
    values["cache:favicon:x"] = {}
    await storage.clearCachedData()
    expect(values[id], "current image survives cleanup").toBeTruthy()
    expect(values["asset:orphan"]).toBeUndefined()
    expect(values["cache:favicon:x"]).toBeUndefined()
    await storage.editStoredEntries(() => ({
      updates: { "omt.webdav": null },
      remove: [id],
    }))
    expect(values["omt.webdav"]).toBeNull()
    expect(values[id]).toBeUndefined()
    expect(JSON.parse(values["omt.theme-mode"] as string).state.theme).toBe(
      "system"
    )
  })
})
