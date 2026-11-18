import Dexie from "dexie"
import { afterEach, expect, it } from "vitest"
import { appRepository } from "@/application/apps"
import { DexieAppRepository } from "@/lib/apps/dexie-app-repository"
import { EntryDatabase } from "@/lib/data/dexie-repository"
import { clearEntries } from "@/lib/storage"

const databases: Dexie[] = []
const databaseName = () => `test-apps-${crypto.randomUUID()}`

function openDatabase(name = databaseName()) {
  const database = new EntryDatabase(name)
  databases.push(database)
  return database
}

afterEach(async () => {
  const names = new Set(databases.map((database) => database.name))
  databases.splice(0).forEach((database) => database.close())
  for (const name of names) await Dexie.delete(name)
})

it("preserves existing workspace entries when upgrading version 1", async () => {
  const name = databaseName()
  const previous = new Dexie(name)
  databases.push(previous)
  previous.version(1).stores({ entries: "&key", metadata: "&key" })
  const home = { key: "omt.home-settings", value: { color: "blue" } }
  await previous.table("entries").put(home)
  previous.close()

  const database = openDatabase(name)
  const storage = new DexieAppRepository(database).storageFor("notes")
  await storage.save({ version: 1, data: "first note" }, null)

  expect(await database.entries.get(home.key)).toEqual(home)
  expect(await storage.read()).toMatchObject({ data: "first note" })
})

it("preserves data across app disable, and scopes documents by App ID", async () => {
  const database = openDatabase()
  const repo = new DexieAppRepository(database)
  const notes = repo.storageFor("notes")
  await repo.setEnabled("notes", true)
  const document = await notes.save({ version: 1, data: "local note" }, null)
  await repo.setEnabled("notes", false)

  expect(await notes.read()).toEqual(document)
  expect(await repo.storageFor("settings").read()).toBeUndefined()
  expect(await database.entries.count()).toBe(0)
})

it("rejects stale writes and preserves newer app document versions", async () => {
  const database = openDatabase()
  const a = new DexieAppRepository(database).storageFor("notes")
  const b = new DexieAppRepository(openDatabase(database.name)).storageFor(
    "notes"
  )
  const first = await a.save({ version: 1, data: "first" }, null)
  const newer = await b.save({ version: 2, data: "newer" }, first.revision)

  await expect(
    a.save({ version: 1, data: "stale" }, first.revision)
  ).rejects.toMatchObject({ code: "CONFLICT" })
  await expect(
    a.save({ version: 1, data: "downgrade" }, newer.revision)
  ).rejects.toMatchObject({ code: "UNSUPPORTED_VERSION" })
  expect(await a.read()).toEqual(newer)
})

it("removes the app document and preference on a full local reset", async () => {
  await clearEntries()
  const notes = appRepository.storageFor("notes")
  await notes.save({ version: 1, data: "about to be erased" }, null)
  await appRepository.setEnabled("notes", true)
  await clearEntries()

  expect(await notes.read()).toBeUndefined()
  const enabled = await new Promise<boolean>((resolve, reject) => {
    const stop = appRepository.watchEnabled(
      "notes",
      (value) => {
        stop()
        resolve(value)
      },
      () => {
        stop()
        reject(new Error("Could not read app availability"))
      }
    )
  })
  expect(enabled).toBe(false)
})
