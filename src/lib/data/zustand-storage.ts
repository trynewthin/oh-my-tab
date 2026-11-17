import { createJSONStorage, type StateStorage } from "zustand/middleware"
import { STORAGE_VERSION } from "@/lib/data-version"
import { sanitizeState } from "@/lib/sanitize"
import { readEntries, writeEntries } from "./storage-engine"

const loaded = new Map<string, unknown>()
// Records that failed even the tolerant read stay untouched until the store
// writes; the first write then archives the original under a rescue key so
// neither the old data nor the new edits are lost.
const protectedKeys = new Set<string>()
const RESCUE_PREFIX = "rescue:"

export type ReadIssue = {
  key: string
  reason: "unreadable" | "partial"
  message?: string
}
const readIssues: ReadIssue[] = []
export function recordReadIssue(issue: ReadIssue) {
  readIssues.push(issue)
}
// Drains issues accumulated during hydration; hydrate.ts folds them into
// the migration report so degraded reads stay visible to the user.
export function drainReadIssues(): ReadIssue[] {
  const issues = readIssues.splice(0)
  return issues
}

type TolerantRead =
  { state: Record<string, unknown>; partial: boolean } | { error?: unknown }

function tolerantEnvelope(name: string, envelope: unknown): TolerantRead {
  if (!envelope || typeof envelope !== "object" || Array.isArray(envelope))
    return {}
  const { version, minReadVersion, state } = envelope as {
    version?: unknown
    minReadVersion?: unknown
    state?: unknown
  }
  if (!Number.isInteger(version) || (version as number) < 0) return {}
  // A writer that knows its data is unreadable below a reader version can
  // say so explicitly; otherwise attempt a best-effort read.
  if (
    (version as number) > STORAGE_VERSION &&
    Number.isInteger(minReadVersion) &&
    (minReadVersion as number) > STORAGE_VERSION
  )
    return {}
  const result = sanitizeState(name, state)
  // Every read through this path is degraded by definition (the envelope is
  // not the current version), so partial is unconditional.
  return result.ok
    ? { state: result.state, partial: true }
    : { error: result.error }
}

export function readStoredValue(name: string, value: unknown): string | null {
  if (value != null) {
    let envelope: unknown = null
    if (typeof value === "string")
      try {
        envelope = JSON.parse(value)
      } catch {
        envelope = undefined
      }
    if (
      envelope === undefined ||
      (envelope as { version?: unknown })?.version !== STORAGE_VERSION ||
      (typeof (envelope as { minReadVersion?: unknown })?.minReadVersion ===
        "number" &&
        (envelope as { minReadVersion: number }).minReadVersion >
          STORAGE_VERSION)
    ) {
      const tolerant = tolerantEnvelope(name, envelope)
      if (!("state" in tolerant)) {
        recordReadIssue({
          key: name,
          reason: "unreadable",
          message:
            tolerant.error instanceof Error
              ? tolerant.error.message
              : undefined,
        })
        // The store now holds defaults in memory; protect the unreadable
        // record so a later write cannot clobber it.
        protectedKeys.add(name)
        loaded.set(name, value)
        return null
      }
      if (tolerant.partial) recordReadIssue({ key: name, reason: "partial" })
      loaded.set(name, value)
      return JSON.stringify({
        state: tolerant.state,
        version: STORAGE_VERSION,
      })
    }
  }
  protectedKeys.delete(name)
  loaded.set(name, value)
  return typeof value === "string" ? value : null
}

const adapter: StateStorage = {
  async getItem(name) {
    return readStoredValue(name, (await readEntries([name]))[name])
  },
  setItem(name, value) {
    const before = loaded.get(name)
    if (before === value) return
    loaded.set(name, value)
    const values: Record<string, unknown> = { [name]: value }
    if (protectedKeys.delete(name)) values[`${RESCUE_PREFIX}${name}`] = before
    void writeEntries(values, true, { [name]: before }).catch(() => {})
  },
  removeItem(name) {
    const values: Record<string, unknown> = { [name]: null }
    if (protectedKeys.delete(name))
      values[`${RESCUE_PREFIX}${name}`] = loaded.get(name)
    loaded.set(name, null)
    void writeEntries(values).catch(() => {})
  },
}
export function storageOptions<T = unknown>() {
  return {
    storage: createJSONStorage<T>(() => adapter),
    skipHydration: true,
    version: STORAGE_VERSION,
  }
}

export function resetStorageAdapter() {
  loaded.clear()
  protectedKeys.clear()
  readIssues.length = 0
}
