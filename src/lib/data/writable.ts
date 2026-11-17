import { STORAGE_VERSION } from "@/lib/data-version"
import { DataError } from "./errors"
import { DATA_KEYS, DEVICE_KEYS } from "./keys"
import type { Entries } from "./repository"

export function assertWritable(
  entries: Entries,
  keys = [...DATA_KEYS, ...DEVICE_KEYS] as readonly string[]
) {
  for (const key of keys) {
    if (
      !(DATA_KEYS as readonly string[]).includes(key) &&
      key !== "omt.privacy"
    )
      continue
    if (typeof entries[key] !== "string") continue
    let envelope: { version?: unknown; minReadVersion?: unknown } | null
    try {
      envelope = JSON.parse(entries[key] as string)
    } catch {
      continue
    }
    if (!envelope || typeof envelope !== "object") continue
    if (
      (typeof envelope.version === "number" &&
        envelope.version > STORAGE_VERSION) ||
      (typeof envelope.minReadVersion === "number" &&
        envelope.minReadVersion > STORAGE_VERSION)
    )
      throw new DataError("UNSUPPORTED_VERSION", { key })
  }
}
