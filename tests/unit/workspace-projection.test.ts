import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { createStore } from "zustand/vanilla"
import { project } from "@/lib/data/projection"
import { localWorkspace as workspace } from "@/lib/data/local-workspace"
import { defaultUiAppearance } from "@/lib/ui-appearance"
import { useThemeStore } from "@/stores/theme-store"
import {
  clearEntries,
  flushStorage,
  allEntries,
} from "@/lib/data/storage-engine"

type Theme = "light" | "dark" | "system"
type ThemeState = {
  theme: Theme
  draft: string
  setTheme: (theme: Theme) => void
  setDraft: (draft: string) => void
}
function createProjection() {
  return createStore<ThemeState>()(
    project(
      (set) => ({
        theme: "light",
        draft: "",
        setTheme: (theme) => set({ theme }),
        setDraft: (draft) => set({ draft }),
      }),
      { section: "theme", partialize: ({ theme }) => ({ theme }) }
    )
  )
}
beforeEach(async () => {
  await flushStorage().catch(() => {})
  await clearEntries()
  await workspace.initialize()
})

afterEach(() => vi.restoreAllMocks())

describe("business projections", () => {
  it("stores each interface appearance preference alongside the theme without changing home appearance", async () => {
    const store = useThemeStore
    const homeBefore = (await workspace.readSections(["home"])).data.home
    await store.projection.rehydrate()
    const { uiRadius, uiBorder, uiShadow } = store.getState()
    expect([
      uiRadius ?? defaultUiAppearance,
      uiBorder ?? defaultUiAppearance,
      uiShadow ?? defaultUiAppearance,
    ]).toEqual(["medium", "medium", "medium"])

    store.getState().setUiRadius("none")
    store.getState().setUiBorder("strong")
    store.getState().setUiShadow("subtle")
    await flushStorage()
    await workspace.execute({
      command: { type: "theme.set", theme: "dark" },
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expectedRevision: (await workspace.readSections(["theme"])).revision,
    })
    await store.projection.rehydrate()
    const appearance = {
      theme: "dark",
      uiRadius: "none",
      uiBorder: "strong",
      uiShadow: "subtle",
    }
    expect(store.getState()).toMatchObject(appearance)
    expect((await workspace.read()).config.home).toEqual(homeBefore)
    expect((await workspace.capture()).config.theme).toEqual(appearance)
  })

  it("keeps runtime updates and hydration from independently writing a business copy", async () => {
    const store = createProjection()
    const before = await allEntries()
    await store.projection.rehydrate()
    store.getState().setDraft("unsaved form")
    store.setState({ theme: "dark" })
    await flushStorage()
    expect(await allEntries()).toEqual(before)
    await store.projection.rehydrate()
    expect(store.getState()).toMatchObject({
      theme: "light",
      draft: "unsaved form",
    })
  })

  it("serializes rapid edits through revisioned commands and hydrates another projection", async () => {
    const first = createProjection(),
      second = createProjection()
    await Promise.all([
      first.projection.rehydrate(),
      second.projection.rehydrate(),
    ])
    first.getState().setTheme("dark")
    first.getState().setTheme("system")
    first.getState().setTheme("dark")
    await flushStorage()
    expect((await workspace.read()).config.theme.theme).toBe("dark")
    await second.projection.rehydrate()
    expect(second.getState().theme).toBe("dark")
    const receipts = Object.keys(await allEntries()).filter((key) =>
      key.startsWith("receipt:")
    )
    expect(receipts).toHaveLength(3)
  })

  it("rejects a stale projection and rolls it back to the committed document", async () => {
    const store = createProjection()
    await store.projection.rehydrate()
    await workspace.execute({
      command: { type: "theme.set", theme: "dark" },
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expectedRevision: (await workspace.read()).revision,
    })
    store.getState().setTheme("system")
    await expect(flushStorage()).rejects.toMatchObject({ code: "CONFLICT" })
    expect(store.getState().theme).toBe("dark")
    expect((await workspace.read()).config.theme.theme).toBe("dark")
  })

  it("preserves another document changed since the projection was loaded", async () => {
    const store = createProjection()
    await store.projection.rehydrate()
    await workspace.execute({
      command: { type: "settings.patch", patch: { text: "OTHER PAGE" } },
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expectedRevision: (await workspace.read()).revision,
    })
    store.getState().setTheme("dark")
    await flushStorage()
    expect((await workspace.read()).config).toMatchObject({
      home: { text: "OTHER PAGE" },
      theme: { theme: "dark" },
    })
  })
  it("does not overwrite an edit with an older hydration response", async () => {
    const store = createProjection()
    await store.projection.rehydrate()
    let release!: () => void, markStarted!: () => void
    const gate = new Promise<void>((resolve) => {
      release = resolve
    })
    const started = new Promise<void>((resolve) => {
      markStarted = resolve
    })
    const read = workspace.readSections.bind(workspace)
    vi.spyOn(workspace, "readSections").mockImplementationOnce(
      async (sections) => {
        const view = await read(sections)
        markStarted()
        await gate
        return view
      }
    )
    const hydration = store.projection.rehydrate()
    await started
    store.getState().setTheme("dark")
    release()
    await hydration
    await flushStorage()
    expect(store.getState().theme).toBe("dark")
    expect((await workspace.read()).config.theme.theme).toBe("dark")
  })

  it("rolls back a storage failure, preserves runtime drafts and allows the next edit", async () => {
    const store = createProjection()
    await store.projection.rehydrate()
    store.getState().setDraft("unsaved form")
    vi.spyOn(workspace, "execute").mockRejectedValueOnce(
      new DOMException("disk full", "QuotaExceededError")
    )
    store.getState().setTheme("dark")
    await expect(flushStorage()).rejects.toThrow("disk full")
    expect(store.getState()).toMatchObject({
      theme: "light",
      draft: "unsaved form",
    })
    store.getState().setTheme("dark")
    await flushStorage()
    expect((await workspace.read()).config.theme.theme).toBe("dark")
  })
})
