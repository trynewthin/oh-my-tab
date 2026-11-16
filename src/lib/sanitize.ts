import { sanitizeHomeSettings } from "@/lib/home-settings"
import { sanitizePersisted } from "@/lib/grid/persisted"
import { validGardenPlant } from "@/lib/garden"
import { validSharedGarden } from "@/lib/shared-garden"

// Tolerant per-key readers: an envelope whose version this client does not
// fully understand is reduced to the fields it can still interpret instead
// of rejecting the whole key. `partial` marks reads that dropped data.
export type SanitizedState =
  { ok: true; state: Record<string, unknown>; partial: boolean } | { ok: false }

function ok(state: Record<string, unknown>, partial: boolean): SanitizedState {
  return { ok: true, state, partial }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

const sanitizers: Record<
  string,
  (state: Record<string, unknown>) => SanitizedState
> = {
  "omt.home-settings": (state) => ok({ ...sanitizeHomeSettings(state) }, true),
  "omt.tab-grid": (state) => ok({ ...sanitizePersisted(state) }, true),
  "omt.garden": (state) => {
    if (validSharedGarden(state)) return ok(state, false)
    const album = Array.isArray(state.album)
      ? state.album.filter(validGardenPlant)
      : []
    return ok(
      {
        points:
          Number.isInteger(state.points) && (state.points as number) >= 0
            ? state.points
            : 0,
        pointsUpdatedAt:
          Number.isFinite(state.pointsUpdatedAt) &&
          (state.pointsUpdatedAt as number) >= 0
            ? state.pointsUpdatedAt
            : Date.now(),
        album,
        initialized: state.initialized === true,
      },
      true
    )
  },
  "omt.search-engines": (state) =>
    Array.isArray(state.engines)
      ? ok(
          {
            engines: state.engines,
            selectedId: state.selectedId,
            openInNewTab: state.openInNewTab ?? true,
          },
          true
        )
      : { ok: false },
  "omt.theme-mode": (state) =>
    state.theme === "light" ||
    state.theme === "dark" ||
    state.theme === "system"
      ? ok({ theme: state.theme }, false)
      : ok({ theme: "light" }, true),
  "omt.onboarding": (state) =>
    ok({ seen: state.seen === true, replay: false }, false),
  "omt.privacy": (state) =>
    ok(
      {
        suggestions: state.suggestions === true,
        icons: state.icons === true,
        browserSearch: state.browserSearch !== false,
      },
      true
    ),
}

// Fallback: a plain object state is readable but possibly partial.
export function sanitizeState(key: string, state: unknown): SanitizedState {
  if (!isRecord(state)) return { ok: false }
  const sanitizer = sanitizers[key]
  if (!sanitizer) return ok(state, true)
  try {
    return sanitizer(state)
  } catch {
    return { ok: false }
  }
}
