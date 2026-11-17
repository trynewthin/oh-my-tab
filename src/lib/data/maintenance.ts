import type { Entries } from "./repository"

export function cacheDeletionPlan(entries: Entries) {
  let background: unknown
  const protectedAssets = new Set<string>()
  for (const [key, raw] of Object.entries(entries)) {
    if (key !== "rescue:omt.home-settings" || typeof raw !== "string") continue
    try {
      const id = JSON.parse(raw)?.state?.backgroundImage
      if (typeof id === "string") protectedAssets.add(id)
    } catch {
      /* Rescue data may still reference an asset we cannot parse. */ return {
        updates: {},
        remove: Object.keys(entries).filter((key) => key.startsWith("cache:")),
      }
    }
  }
  try {
    const raw = entries["omt.home-settings"]
    if (typeof raw === "string")
      background = JSON.parse(raw)?.state?.backgroundImage
  } catch {
    /* An unreadable profile must not lose its assets. */
  }
  const remove = Object.keys(entries).filter((key) => {
    if (key.startsWith("cache:")) return true
    if (
      !key.startsWith("asset:") ||
      key === background ||
      protectedAssets.has(key) ||
      background === undefined
    )
      return false
    const createdAt = (entries[key] as { createdAt?: number } | null)?.createdAt
    return typeof createdAt === "number" && createdAt < Date.now() - 86400000
  })
  return { updates: {}, remove }
}
