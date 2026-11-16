import { readEntries, writeEntries } from "@/lib/storage"

export const MIGRATION_REPORT_KEY = "omt.migration-report"

export type MigrationReportEntry = {
  key: string
  reason: string
  partial?: boolean
  at: number
}

const MAX_ENTRIES = 50

function validEntry(value: unknown): value is MigrationReportEntry {
  const entry = value as MigrationReportEntry
  return (
    !!entry &&
    typeof entry === "object" &&
    typeof entry.key === "string" &&
    typeof entry.reason === "string" &&
    Number.isFinite(entry.at)
  )
}

export async function readMigrationReport(): Promise<MigrationReportEntry[]> {
  const raw = (await readEntries([MIGRATION_REPORT_KEY]))[MIGRATION_REPORT_KEY]
  if (typeof raw !== "string") return []
  try {
    const parsed: unknown = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter(validEntry) : []
  } catch {
    return []
  }
}

// Append-only, newest first, capped: the report explains what degraded
// reads dropped or salvaged, it is not an audit log.
export async function appendMigrationReport(
  entries: Omit<MigrationReportEntry, "at">[]
) {
  if (!entries.length) return
  const at = Date.now()
  const stamped = entries.map((entry) => ({ ...entry, at }))
  const current = await readMigrationReport()
  // Keep the newest batch in full; older entries are evicted first.
  await writeEntries(
    {
      [MIGRATION_REPORT_KEY]: JSON.stringify(
        [...stamped.slice(-MAX_ENTRIES), ...current].slice(0, MAX_ENTRIES)
      ),
    },
    false
  )
}
