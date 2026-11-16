import { beforeEach, describe, expect, it } from "vitest"
import {
  clearAllData,
  flushStorage,
  readEntries,
  writeEntries,
} from "@/lib/storage"
import { migrateStoredData } from "@/lib/migrations/storage"
import {
  MIGRATION_REPORT_KEY,
  readMigrationReport,
} from "@/lib/migration-report"
import { STORAGE_VERSION } from "@/lib/data-version"
import { legacyLocalStorage } from "./setup"

const MARKER = "omt.migrations"
const envelope = (state: unknown, version = 0) =>
  JSON.stringify({ state, version })

beforeEach(async () => {
  legacyLocalStorage.clear()
  await flushStorage().catch(() => {})
  await clearAllData()
})

describe("per-key migration isolation", () => {
  it("migrates readable keys while skipping a corrupt one", async () => {
    await writeEntries(
      {
        "omt.theme-mode": envelope({ theme: "dark" }, 0),
        "omt.search-engines": "{ corrupted",
        [MARKER]: STORAGE_VERSION,
      },
      false
    )
    await flushStorage()
    await expect(migrateStoredData()).resolves.toBeUndefined()
    const migrated = JSON.parse(
      (await readEntries(["omt.theme-mode"]))["omt.theme-mode"] as string
    )
    expect(migrated.version).toBe(STORAGE_VERSION)
    const report = await readMigrationReport()
    expect(report.map((entry) => entry.key)).toContain("omt.search-engines")
  })

  it("keeps newer-version keys and notes them in the report", async () => {
    await writeEntries(
      {
        "omt.theme-mode": envelope(
          { theme: "dark", future: true },
          STORAGE_VERSION + 1
        ),
        [MARKER]: STORAGE_VERSION,
      },
      false
    )
    await flushStorage()
    await migrateStoredData()
    // The newer envelope is left in place for the tolerant reader.
    const raw = (await readEntries(["omt.theme-mode"]))["omt.theme-mode"]
    expect(JSON.parse(raw as string).version).toBe(STORAGE_VERSION + 1)
    const report = await readMigrationReport()
    expect(
      report.some(
        (entry) =>
          entry.key === "omt.theme-mode" && entry.reason === "newer-version"
      )
    ).toBe(true)
  })

  it("does not fail when the marker belongs to a newer client", async () => {
    await writeEntries(
      {
        "omt.theme-mode": envelope({ theme: "dark" }, STORAGE_VERSION),
        [MARKER]: STORAGE_VERSION + 1,
      },
      false
    )
    await flushStorage()
    await expect(migrateStoredData()).resolves.toBeUndefined()
    const report = await readMigrationReport()
    expect(report.some((entry) => entry.key === MARKER)).toBe(true)
  })

  it("keeps a failed cross-migration from losing the other keys", async () => {
    // tab-grid migrates fine, garden envelope is unreadable JSON: the garden
    // cross-migration must not roll back tab-grid's update.
    await writeEntries(
      {
        "omt.tab-grid": envelope({ items: [], layouts: {} }, 0),
        "omt.garden": "{ broken",
        [MARKER]: STORAGE_VERSION,
      },
      false
    )
    await flushStorage()
    await migrateStoredData()
    const migrated = JSON.parse(
      (await readEntries(["omt.tab-grid"]))["omt.tab-grid"] as string
    )
    expect(migrated.version).toBe(STORAGE_VERSION)
    const report = await readMigrationReport()
    expect(report.some((entry) => entry.key === "omt.garden")).toBe(true)
  })
})

describe("migration report storage", () => {
  it("round-trips and caps entries", async () => {
    const { appendMigrationReport } = await import("@/lib/migration-report")
    await appendMigrationReport(
      Array.from({ length: 60 }, (_, i) => ({
        key: `k${i}`,
        reason: "unreadable",
      }))
    )
    const report = await readMigrationReport()
    expect(report.length).toBe(50)
    expect(report.some((entry) => entry.key === "k59")).toBe(true)
    expect(report.some((entry) => entry.key === "k0")).toBe(false)
    const raw = (await readEntries([MIGRATION_REPORT_KEY]))[
      MIGRATION_REPORT_KEY
    ]
    expect(typeof raw).toBe("string")
  })
})
