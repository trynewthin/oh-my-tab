import Dexie, { liveQuery, type Table } from "dexie"
import type { Entries, EntryMutation, EntryRepository } from "./repository"
import { DataError } from "./errors"
import { DATA_KEYS, REVISION_KEY } from "./keys"

export async function legacySourceHash(source: Entries) {
  const bytes = new TextEncoder().encode(
    JSON.stringify([REVISION_KEY, ...DATA_KEYS].map((key) => source[key]))
  )
  return Array.from(
    new Uint8Array(await crypto.subtle.digest("SHA-256", bytes)),
    (byte) => byte.toString(16).padStart(2, "0")
  ).join("")
}

type Entry = { key: string; value: unknown }
type Metadata = { key: string; value: unknown }

export class EntryDatabase extends Dexie {
  entries!: Table<Entry, string>
  metadata!: Table<Metadata, string>

  constructor(name = "oh-my-tab-workspace") {
    super(name)
    this.version(1).stores({ entries: "&key", metadata: "&key" })
  }
}

export class DexieEntryRepository implements EntryRepository {
  readonly database: EntryDatabase

  constructor(database = new EntryDatabase()) {
    this.database = database
  }

  async read(keys?: readonly string[]): Promise<Entries> {
    if (keys) {
      const rows = await this.database.entries.bulkGet([...keys])
      return Object.fromEntries(keys.map((key, i) => [key, rows[i]?.value]))
    }
    return Object.fromEntries(
      (await this.database.entries.toArray()).map(({ key, value }) => [
        key,
        value,
      ])
    )
  }

  async mutate<T>(
    operation: (entries: Entries) => EntryMutation<T>,
    selectedKeys?: readonly string[]
  ): Promise<T> {
    return this.database.transaction(
      "rw",
      this.database.entries,
      this.database.metadata,
      async () => {
        const {
          updates,
          remove = [],
          notify = true,
          result,
        } = operation(await this.read(selectedKeys))
        const keys = [...new Set([...Object.keys(updates), ...remove])]
        if (!keys.length) return result
        await this.database.entries.bulkPut(
          Object.entries(updates).map(([key, value]) => ({ key, value }))
        )
        await this.database.entries.bulkDelete(remove)
        if (notify) {
          await this.database.metadata.bulkPut(
            Object.keys(updates).map((key) => ({
              key: `entry:${key}`,
              value: crypto.randomUUID(),
            }))
          )
          await this.database.metadata.bulkDelete(
            remove.map((key) => `entry:${key}`)
          )
        }
        return result
      }
    )
  }

  subscribe(listener: (keys: string[]) => void) {
    let previous = new Map<string, unknown>()
    const subscription = liveQuery(() =>
      this.database.metadata.toArray()
    ).subscribe({
      next: (rows) => {
        const current = new Map(
          rows
            .filter((row) => row.key.startsWith("entry:"))
            .map((row) => [row.key.slice(6), row.value])
        )
        const keys = [
          ...new Set([...previous.keys(), ...current.keys()]),
        ].filter((key) => previous.get(key) !== current.get(key))
        previous = current
        if (keys.length) listener(keys)
      },
    })
    return () => subscription.unsubscribe()
  }

  async verifyLegacyRevision(revision: unknown) {
    const marker = (await this.database.metadata.get("legacy-import"))
      ?.value as { source?: string; sourceRevision?: unknown } | undefined
    if (marker?.source === "chrome" && marker.sourceRevision !== revision)
      throw new DataError("LEGACY_CHANGED")
  }

  async verifyLegacySource(source: Entries) {
    const marker = (await this.database.metadata.get("legacy-import"))
      ?.value as
      | { source?: string; sourceHash?: string; sourceRevision?: unknown }
      | undefined
    if (marker?.source !== "chrome") return
    if (
      marker.sourceRevision !== source[REVISION_KEY] ||
      (marker.sourceHash &&
        marker.sourceHash !== (await legacySourceHash(source)))
    )
      throw new DataError("LEGACY_CHANGED")
  }

  async importLegacy(readSource: () => Promise<Entries>, sourceKind = "web") {
    if (await this.database.metadata.get("legacy-import")) return
    // Source reads/decoding happen before the target transaction. The caller
    // holds the existing cross-page write lock during this cutover window.
    const source = await readSource()
    const sourceHash = await legacySourceHash(source)
    if (
      sourceKind === "chrome" &&
      (await legacySourceHash(await readSource())) !== sourceHash
    )
      throw new DataError("LEGACY_CHANGED")
    await this.database.transaction(
      "rw",
      this.database.entries,
      this.database.metadata,
      async () => {
        if (await this.database.metadata.get("legacy-import")) return
        const current = await this.read()
        if (Object.keys(current).length && Object.keys(source).length)
          throw new Error("Existing target data prevents legacy import")
        await this.database.entries.bulkPut(
          Object.entries(source).map(([key, value]) => ({ key, value }))
        )
        await this.database.metadata.put({
          key: "legacy-import",
          value: {
            version: 1,
            completedAt: Date.now(),
            source: sourceKind,
            sourceRevision: source["omt.revision"],
            sourceHash,
          },
        })
      }
    )
  }
}
