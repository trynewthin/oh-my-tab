import { liveQuery } from "dexie"
import { z } from "zod"
import type { EntryDatabase } from "@/lib/data/dexie-repository"
import { DataError } from "@/lib/data/errors"
import type { AppId } from "./ids"
import type { AppStorage } from "./storage"

// The retired Notes app still has local records from older versions.
type AppRecordId = AppId | "notes"

const appDocument = z.object({
  version: z.number().int().positive(),
  revision: z.string().min(1),
  data: z.unknown(),
})

export class DexieAppRepository {
  private readonly database: EntryDatabase

  constructor(database: EntryDatabase) {
    this.database = database
  }

  storageFor(id: AppRecordId): AppStorage {
    const key = `document:${id}`
    const { appRecords } = this.database
    const read = async () => {
      const entry = await appRecords.get(key)
      if (entry) return appDocument.parse(entry.value)
    }

    return {
      read,
      save: (document, expectedRevision) =>
        this.database.transaction("rw", appRecords, async () => {
          const current = await read()
          if ((current?.revision ?? null) !== expectedRevision)
            throw new DataError("CONFLICT")
          if (current && current.version > document.version)
            throw new DataError("UNSUPPORTED_VERSION")
          const next = appDocument.parse({
            ...document,
            revision: crypto.randomUUID(),
          })
          await appRecords.put({ key, value: next })
          return next
        }),
    }
  }

  watchEnabled(
    id: AppRecordId,
    next: (enabled: boolean) => void,
    error: () => void
  ) {
    const subscription = liveQuery(async () => {
      const entry = await this.database.appRecords.get(`enabled:${id}`)
      return entry?.value === true
    }).subscribe({ next, error })
    return () => subscription.unsubscribe()
  }

  async setEnabled(id: AppRecordId, enabled: boolean) {
    const key = `enabled:${id}`
    await this.database.appRecords.put({ key, value: enabled })
  }
}
