import Dexie from "dexie"
import type { Entries } from "./repository"
import { DataError } from "./errors"

type ChromeStorage = {
  local: {
    get(keys: string[] | null): Promise<Entries>
    remove(keys: string[]): Promise<void>
    setAccessLevel?(options: { accessLevel: "TRUSTED_CONTEXTS" }): Promise<void>
  }
}

export const chromeStorage = () =>
  location.protocol === "chrome-extension:"
    ? (
        globalThis as typeof globalThis & {
          chrome?: { storage?: ChromeStorage }
        }
      ).chrome?.storage
    : undefined

const LEGACY_DATABASE = "oh-my-tab-data"

export async function readLegacyEntries(): Promise<Entries> {
  const chrome = chromeStorage()
  if (chrome) return chrome.local.get(null)
  if (!(await Dexie.exists(LEGACY_DATABASE))) return {}
  const database = new Dexie(LEGACY_DATABASE)
  // Fence pre-migration web clients: their indexedDB.open(name, 1) can no
  // longer reopen this source. An existing old connection must close first.
  database.version(2).stores({ entries: "" })
  let blocked = false
  database.on("blocked", () => {
    blocked = true
    database.close()
  })
  try {
    await database.open()
    const table = database.table<unknown, string>("entries")
    return await database.transaction("r", table, async () => {
      const keys = await table.toCollection().primaryKeys()
      const values = await table.bulkGet(keys)
      return Object.fromEntries(keys.map((key, i) => [key, values[i]]))
    })
  } catch (error) {
    if (blocked) throw new DataError("MIGRATION_BLOCKED")
    throw error
  } finally {
    database.close()
  }
}

export async function clearLegacyEntries() {
  const chrome = chromeStorage()
  if (chrome) {
    const entries = await chrome.local.get(null)
    const keys = Object.keys(entries)
    if (keys.length) await chrome.local.remove(keys)
    return
  }
  if (!(await Dexie.exists(LEGACY_DATABASE))) return
  const database = new Dexie(LEGACY_DATABASE)
  try {
    await database.open()
    await database.table("entries").clear()
  } finally {
    database.close()
  }
}
