import { i18n } from "@/i18n"
import { DexieEntryRepository, legacySourceHash } from "./dexie-repository"
import {
  chromeStorage,
  clearLegacyEntries,
  readLegacyEntries,
} from "./legacy-storage"
import {
  DATA_KEYS,
  REVISION_KEY,
  documentRevisions,
  revisionEntries,
} from "./keys"
import type { Entries, EntryMutation } from "./repository"
import { DataError } from "./errors"
import { assertWritable } from "./writable"

export { DATA_KEYS, DEVICE_KEYS } from "./keys"
export { chromeStorage } from "./legacy-storage"

export const repository = new DexieEntryRepository()
export const storageLabel = () => i18n.t("core.storage.indexedDbLabel")
const listeners = new Set<(keys: string[]) => void>()
let unsubscribeRepository: (() => void) | undefined

export function subscribeStorage(listener: (keys: string[]) => void) {
  listeners.add(listener)
  unsubscribeRepository ??= repository.subscribe((keys) => {
    listeners.forEach((callback) => callback(keys))
  })
  return () => {
    listeners.delete(listener)
    if (!listeners.size) {
      unsubscribeRepository?.()
      unsubscribeRepository = undefined
    }
  }
}

export const readEntries = (keys: readonly string[]) => repository.read(keys)
export const allEntries = () => repository.read()
let queue = Promise.resolve()
let writeError: unknown
const writeDrains = new Set<() => Promise<void>>()
const resetListeners = new Set<() => void>()
const reportedErrors = new WeakSet<object>()

export function registerWriteDrain(drain: () => Promise<void>) {
  writeDrains.add(drain)
  return () => {
    writeDrains.delete(drain)
  }
}

export function registerStorageReset(listener: () => void) {
  resetListeners.add(listener)
  return () => {
    resetListeners.delete(listener)
  }
}

async function verifyLegacySource() {
  const chrome = chromeStorage()
  if (chrome)
    await repository.verifyLegacySource(
      await chrome.local.get([REVISION_KEY, ...DATA_KEYS])
    )
}

function storageErrorMessage(error: unknown) {
  if (error instanceof DataError) {
    if (error.code === "LEGACY_CHANGED")
      return i18n.t("core.storage.legacyChanged")
    if (error.code === "UNSUPPORTED_VERSION")
      return i18n.t("core.storage.readOnly")
    if (error.code === "CONFLICT") return i18n.t("core.storage.staleWrite")
  }
  return error instanceof Error
    ? error.message
    : i18n.t("core.storage.saveFailed")
}

export function reportWriteFailure(error: unknown, keys: string[]) {
  if (error && typeof error === "object") {
    if (reportedErrors.has(error)) return
    reportedErrors.add(error)
  }
  window.dispatchEvent(
    new CustomEvent("omt-storage-error", { detail: storageErrorMessage(error) })
  )
  listeners.forEach((listener) => listener(keys))
}

function enqueue<T>(keys: string[], operation: () => Promise<T>): Promise<T> {
  const result = queue.then(() =>
    navigator.locks.request("omt-write", async () => {
      await verifyLegacySource()
      return operation()
    })
  )
  queue = result.then(
    () => {},
    (error) => {
      writeError = error
      reportWriteFailure(error, keys)
    }
  )
  return result
}

export function writeEntries(
  values: Entries,
  notify = true,
  expected?: Entries
): Promise<void> {
  const keys = Object.keys(values)
  return enqueue(keys, () =>
    repository.mutate(
      (current) => {
        assertWritable(current, keys)
        if (
          expected &&
          Object.keys(expected).some((key) => current[key] !== expected[key])
        )
          throw new Error(i18n.t("core.storage.staleWrite"))
        const updates = keys.some((key) =>
          (DATA_KEYS as readonly string[]).includes(key)
        )
          ? {
              ...values,
              ...revisionEntries(documentRevisions(values)),
              [REVISION_KEY]: crypto.randomUUID(),
            }
          : values
        return { updates, notify, result: undefined }
      },
      [
        ...new Set([
          ...keys,
          ...Object.keys(expected ?? {}),
          REVISION_KEY,
          "omt.migrations",
        ]),
      ]
    )
  )
}

async function flushQueuedStorage() {
  await queue
  if (writeError) {
    const error = writeError
    writeError = undefined
    throw error instanceof Error
      ? error
      : new Error(i18n.t("core.storage.persistFailed"))
  }
}

export async function flushStorage() {
  let failure: unknown
  for (const drain of writeDrains) {
    try {
      await drain()
    } catch (error) {
      failure ??= error
    }
  }
  try {
    await flushQueuedStorage()
  } catch (error) {
    failure ??= error
  }
  if (failure) throw failure
}

export async function storageRevision() {
  await flushStorage()
  return (await readEntries([REVISION_KEY]))[REVISION_KEY] as string | undefined
}

export async function initializeStorage() {
  if (location.protocol === "chrome-extension:" && !chromeStorage())
    throw new Error(i18n.t("core.storage.permission"))
  await chromeStorage()?.local.setAccessLevel?.({
    accessLevel: "TRUSTED_CONTEXTS",
  })
  try {
    await navigator.locks.request("omt-write", async () => {
      await repository.importLegacy(
        readLegacyEntries,
        chromeStorage() ? "chrome" : "web"
      )
      await verifyLegacySource()
    })
  } catch (error) {
    if (error instanceof DataError && error.code === "MIGRATION_BLOCKED")
      throw new Error(i18n.t("core.storage.blocked"), { cause: error })
    if (error instanceof DataError && error.code === "LEGACY_CHANGED")
      throw new Error(storageErrorMessage(error), { cause: error })
    throw error
  }
}

export async function replaceData(
  values: Entries,
  revision: string | undefined
) {
  await flushStorage()
  await writeEntries(values, true, { [REVISION_KEY]: revision })
}

export async function mutateEntries<T>(
  operation: (entries: Entries) => EntryMutation<T>,
  keys?: readonly string[]
): Promise<T> {
  await flushQueuedStorage()
  return enqueue(keys ? [...keys] : [], () =>
    repository.mutate(operation, keys)
  )
}

export async function editStoredEntries(
  plan: (entries: Entries) => { updates: Entries; remove: string[] }
) {
  await flushStorage()
  await mutateEntries((entries) => {
    const { updates, remove } = plan(entries)
    assertWritable(entries, [...Object.keys(updates), ...remove])
    if (!Object.keys(updates).length && !remove.length)
      return { updates, remove, result: undefined }
    return {
      updates: {
        ...updates,
        ...revisionEntries(
          documentRevisions(
            Object.fromEntries([
              ...Object.entries(updates),
              ...remove.map((key) => [key, null]),
            ])
          )
        ),
        ...([...Object.keys(updates), ...remove].some((key) =>
          (DATA_KEYS as readonly string[]).includes(key)
        )
          ? { [REVISION_KEY]: crypto.randomUUID() }
          : {}),
      },
      remove,
      result: undefined,
    }
  })
}

export async function clearEntries() {
  await flushStorage()
  // Clear the retained source before deleting active data. A failed source
  // cleanup leaves the active workspace intact and can be retried.
  await navigator.locks.request("omt-write", async () => {
    await clearLegacyEntries()
    const sourceHash = await legacySourceHash({})
    await repository.database.transaction(
      "rw",
      repository.database.entries,
      repository.database.metadata,
      repository.database.appRecords,
      async () => {
        await repository.database.entries.clear()
        await repository.database.metadata.clear()
        await repository.database.appRecords.clear()
        await repository.database.metadata.put({
          key: "legacy-import",
          value: {
            version: 1,
            source: chromeStorage() ? "chrome" : "web",
            sourceHash,
          },
        })
      }
    )
    resetListeners.forEach((listener) => listener())
  })
}
