import type { StateCreator } from "zustand"
import { workspaceCommandSchema, type WorkspaceCommand } from "./commands"
import { DataError } from "./errors"
import { workspaceClient } from "./service-client"
import { documentKeys } from "./keys"
import { recordReadIssue } from "./zustand-storage"
import {
  registerStorageReset,
  registerWriteDrain,
  reportWriteFailure,
} from "./storage-engine"

type Section = keyof typeof documentKeys
type StateOf<S> = S extends { getState: () => infer T } ? T : never
type Options<T, U> = {
  section: Section
  partialize: (state: T) => U
  merge?: (persisted: unknown, current: T) => T
}
type Controller<T, U> = {
  rehydrate(): Promise<void>
  hasHydrated(): boolean
  getOptions(): Options<T, U> & { name: string }
  update: (partial: Partial<T> | ((state: T) => Partial<T>)) => void
  source: () => Promise<unknown>
}

declare module "zustand/vanilla" {
  interface StoreMutators<S, A> {
    "workspace/projection": S & { projection: Controller<StateOf<S>, A> }
  }
}

let writeTail: Promise<void> = Promise.resolve()
let writeFailure: unknown
registerWriteDrain(async () => {
  await writeTail
  if (writeFailure) {
    const error = writeFailure
    writeFailure = undefined
    throw error
  }
})

function enqueue<T>(
  operation: () => Promise<T>,
  recover?: () => Promise<void>
) {
  const result = writeTail.then(operation).catch(async (error) => {
    await recover?.().catch(() => {})
    throw error
  })
  writeTail = result.then(
    () => {},
    (error) => {
      writeFailure ??= error
      reportWriteFailure(error, Object.values(documentKeys))
    }
  )
  return result
}

function commandFor(
  section: Section,
  before: unknown,
  next: unknown
): WorkspaceCommand {
  switch (section) {
    case "home":
      return workspaceCommandSchema.parse({
        type: "settings.patch",
        patch: Object.fromEntries(
          Object.entries(next as Record<string, unknown>).filter(
            ([key, value]) =>
              JSON.stringify(value) !==
              JSON.stringify((before as Record<string, unknown>)[key])
          )
        ),
      })
    case "theme":
      return workspaceCommandSchema.parse({
        type: "theme.set",
        ...(next as object),
      })
    case "search":
      return workspaceCommandSchema.parse({
        type: "search.configure",
        search: next,
      })
    case "grid":
      return workspaceCommandSchema.parse({ type: "grid.replace", grid: next })
    case "garden":
      return workspaceCommandSchema.parse({
        type: "garden.configure",
        garden: next,
      })
    case "onboarding":
      return workspaceCommandSchema.parse({
        type: "onboarding.set-seen",
        ...(next as object),
      })
  }
}

// Zustand holds an optimistic projection. Only domain commands write business
// data; hydration and runtime setState never automatically persist a copy.
export function project<T, U>(
  initializer: StateCreator<T, [], []>,
  options: Options<T, U>
): StateCreator<T, [], [["workspace/projection", U]]> {
  return (set, get, api) => {
    const name = documentKeys[options.section]
    let hydrated = false
    let loadedRevision: string | undefined
    let pending: Promise<unknown> | undefined
    let editGeneration = 0
    let loadGeneration = 0

    async function load(force = false) {
      const edits = editGeneration
      const loading = ++loadGeneration
      const view = await workspaceClient.readSections([options.section])
      if (
        loading !== loadGeneration ||
        (!force && (pending || edits !== editGeneration))
      )
        return
      const persisted = view.data[options.section]
      set(
        options.merge
          ? options.merge(persisted, get())
          : { ...get(), ...persisted }
      )
      loadedRevision = view.documentRevisions[options.section]
      view.issues.forEach((issue) =>
        recordReadIssue({
          key: documentKeys[issue.section],
          reason: issue.reason,
        })
      )
      hydrated = true
    }

    const update: typeof set = (partial, replace) => {
      const before = options.partialize(get())
      if (replace) set(partial as T, true)
      else set(partial, false)
      const next = structuredClone(options.partialize(get()))
      if (JSON.stringify(before) === JSON.stringify(next)) return
      editGeneration++
      const previous = pending ?? Promise.resolve(loadedRevision)
      const result = enqueue(
        async () => {
          const expected = await previous
          const command = commandFor(options.section, before, next)
          const current = await workspaceClient.readSections([options.section])
          if (current.documentRevisions[options.section] !== expected)
            throw new DataError("CONFLICT", { section: options.section })
          const receipt = await workspaceClient.execute({
            command,
            requestId: crypto.randomUUID(),
            issuedAt: Date.now(),
            expectedRevision: current.revision,
          })
          loadedRevision = receipt.documentRevisions[options.section]
          return loadedRevision
        },
        () => load(true)
      )
      pending = result
      const settled = () => {
        if (pending === result) pending = undefined
      }
      void result.then(settled, settled)
    }

    registerStorageReset(() => {
      editGeneration++
      loadGeneration++
      loadedRevision = undefined
      hydrated = false
      pending = undefined
    })
    const controller: Controller<T, U> = {
      rehydrate: async () => {
        await writeTail
        await load()
      },
      hasHydrated: () => hydrated,
      getOptions: () => ({ ...options, name }),
      update,
      source: () => pending ?? Promise.resolve(loadedRevision),
    }
    Object.assign(api, { projection: controller })
    return initializer(update, get, api)
  }
}

export function dispatchProjectedCommand(
  command: WorkspaceCommand,
  sources: Partial<Record<Section, Promise<unknown>>>
) {
  return enqueue(async () => {
    const sections = Object.keys(sources) as Section[]
    const expected = await Promise.all(
      sections.map((section) => sources[section])
    )
    const current = await workspaceClient.readSections(sections)
    if (
      sections.some(
        (section, index) =>
          current.documentRevisions[section] !== expected[index]
      )
    )
      throw new DataError("CONFLICT")
    return workspaceClient.execute({
      command,
      requestId: crypto.randomUUID(),
      issuedAt: Date.now(),
      expectedRevision: current.revision,
    })
  })
}
