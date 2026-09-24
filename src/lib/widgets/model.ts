import type {
  PomodoroItem,
  UtilityWidgetItem,
  UtilityWidgetKind,
  UtilityWidgetSize,
} from "@/lib/grid/utility-types"

export const NOTE_MAX_LENGTH = 4000
export const PHOTO_MAX_BYTES = 512 * 1024
const PHOTO_MAX_DATA_LENGTH = Math.ceil(PHOTO_MAX_BYTES / 3) * 4 + 40
export const MAX_COUNTDOWN_EVENTS = 4
export const MAX_WORLD_CLOCKS = 4
const DAY_MS = 86_400_000

export function localDateKey(now: number | Date = Date.now()) {
  const date = now instanceof Date ? now : new Date(now)
  return [
    String(date.getFullYear()).padStart(4, "0"),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-")
}

export function dateOrdinal(value: unknown): number | null {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return null
  const [year, month, day] = value.split("-").map(Number)
  if (year < 1000 || year > 9999) return null
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toISOString().slice(0, 10) === value
    ? date.getTime() / DAY_MS
    : null
}

/** Calendar days, not elapsed 24-hour periods: DST does not add a day. */
export function daysUntil(date: string, now: number | Date = Date.now()) {
  const target = dateOrdinal(date)
  const today = dateOrdinal(localDateKey(now))
  return target === null || today === null ? null : target - today
}

export function validTimeZone(value: unknown): value is string {
  if (typeof value !== "string" || value.length > 100) return false
  if (!value) return true
  try {
    new Intl.DateTimeFormat("en", { timeZone: value }).format(0)
    return true
  } catch {
    return false
  }
}

export function remainingTime(item: PomodoroItem, now = Date.now()) {
  return Math.max(
    0,
    Math.min(
      item.minutes * 60_000,
      item.endsAt === null ? item.remainingMs : item.endsAt - now
    )
  )
}

export function completePomodoro(item: PomodoroItem, now = Date.now()) {
  if (item.endsAt === null || now < item.endsAt) return item
  const day = localDateKey(item.endsAt)
  return {
    ...item,
    endsAt: null,
    remainingMs: 0,
    completedOn: day,
    completedToday: Math.min(
      1_000_000,
      item.completedOn === day ? item.completedToday + 1 : 1
    ),
  }
}

export function togglePomodoro(item: PomodoroItem, now = Date.now()) {
  const current = completePomodoro(item, now)
  if (current.endsAt !== null)
    return {
      ...current,
      remainingMs: remainingTime(current, now),
      endsAt: null,
    }
  const remainingMs = current.remainingMs || current.minutes * 60_000
  return { ...current, remainingMs, endsAt: now + remainingMs }
}

export function resetPomodoro(item: PomodoroItem) {
  return { ...item, endsAt: null, remainingMs: item.minutes * 60_000 }
}

export function formatDuration(milliseconds: number) {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000))
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(
    seconds % 60
  ).padStart(2, "0")}`
}

export function safeLink(value: unknown, base?: string): string | null {
  if (typeof value !== "string" || value.length > 2048) return null
  try {
    const url = new URL(value, base)
    if (!/^https?:$/.test(url.protocol) || url.username || url.password)
      return null
    return url.href
  } catch {
    return null
  }
}

/** Remote widgets accept public HTTPS origins; never local/credentialed URLs. */
export function remoteUrl(value: unknown): string | null {
  const link = safeLink(value)
  if (!link) return null
  const url = new URL(link)
  const host = url.hostname.toLowerCase()
  if (
    url.protocol !== "https:" ||
    (url.port && url.port !== "443") ||
    !host.includes(".") ||
    host.endsWith(".") ||
    /(?:^|\.)(?:localhost|local|internal|test|invalid)$/.test(host) ||
    host.startsWith("[") ||
    /^\d+\.\d+\.\d+\.\d+$/.test(host)
  )
    return null
  url.hash = ""
  return url.href
}

export function validRepository(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length <= 140 &&
    /^[a-z\d](?:[a-z\d-]{0,37}[a-z\d])?\/[a-z\d_.-]{1,100}$/i.test(
      value
    ) &&
    ![".", ".."].includes(value.split("/")[1])
  )
}

export function validPhoto(value: unknown): value is string {
  if (value === "") return true
  if (typeof value !== "string" || value.length > PHOTO_MAX_DATA_LENGTH)
    return false
  const match =
    /^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || match[2].length % 4 !== 0) return false
  try {
    const data = atob(match[2])
    if (data.length > PHOTO_MAX_BYTES) return false
    if (match[1] === "png") return data.startsWith("\x89PNG\r\n\x1a\n")
    if (match[1] === "jpeg") return data.startsWith("\xff\xd8\xff")
    return data.startsWith("RIFF") && data.slice(8, 12) === "WEBP"
  } catch {
    return false
  }
}

const text = (value: unknown, max: number, nonempty = false): value is string =>
  typeof value === "string" &&
  value.length <= max &&
  (!nonempty || value.trim().length > 0)

const integer = (value: unknown, min: number, max: number) =>
  typeof value === "number" &&
  Number.isInteger(value) &&
  value >= min &&
  value <= max

function distinctIds(values: { id: string }[]) {
  return new Set(values.map((value) => value.id)).size === values.length
}

export function validUtilityWidget(item: UtilityWidgetItem): boolean {
  switch (item.kind) {
    case "clock":
      return (
        typeof item.hour12 === "boolean" &&
        typeof item.showSeconds === "boolean" &&
        validTimeZone(item.timeZone)
      )
    case "countdown":
      return (
        Array.isArray(item.events) &&
        item.events.length <= MAX_COUNTDOWN_EVENTS &&
        item.events.every(
          (event) =>
            event &&
            text(event.id, 100, true) &&
            text(event.title, 40, true) &&
            dateOrdinal(event.date) !== null
        ) &&
        distinctIds(item.events)
      )
    case "note":
      return text(item.text, NOTE_MAX_LENGTH)
    case "pomodoro":
      return (
        integer(item.minutes, 1, 180) &&
        integer(item.remainingMs, 0, item.minutes * 60_000) &&
        (item.endsAt === null ||
          integer(item.endsAt, 0, 8_640_000_000_000_000)) &&
        (item.completedOn === "" || dateOrdinal(item.completedOn) !== null) &&
        integer(item.completedToday, 0, 1_000_000)
      )
    case "weather":
      return (
        text(item.locationName, 40) &&
        ["celsius", "fahrenheit"].includes(item.unit) &&
        ((item.latitude === null && item.longitude === null) ||
          (typeof item.latitude === "number" &&
            Number.isFinite(item.latitude) &&
            Math.abs(item.latitude) <= 90 &&
            typeof item.longitude === "number" &&
            Number.isFinite(item.longitude) &&
            Math.abs(item.longitude) <= 180))
      )
    case "photo":
      return (
        validPhoto(item.image) &&
        text(item.caption, 120) &&
        ["cover", "contain"].includes(item.fit)
      )
    case "bookmark-list":
      return text(item.folderId, 100)
    case "rss":
      return item.feedUrl === "" || remoteUrl(item.feedUrl) !== null
    case "github-repo":
      return item.repository === "" || validRepository(item.repository)
    case "world-clock":
      return (
        typeof item.hour12 === "boolean" &&
        Array.isArray(item.zones) &&
        item.zones.length >= 1 &&
        item.zones.length <= MAX_WORLD_CLOCKS &&
        item.zones.every(
          (zone) =>
            zone &&
            text(zone.id, 100, true) &&
            text(zone.label, 40, true) &&
            text(zone.timeZone, 100, true) &&
            validTimeZone(zone.timeZone)
        ) &&
        distinctIds(item.zones)
      )
  }
}

export function createUtilityWidget(
  kind: UtilityWidgetKind,
  shared: {
    id: string
    name: string
    color: string
    size: UtilityWidgetSize
  }
): UtilityWidgetItem {
  switch (kind) {
    case "clock":
      return {
        ...shared,
        kind,
        hour12: false,
        showSeconds: false,
        timeZone: "",
      }
    case "countdown":
      return { ...shared, kind, events: [] }
    case "note":
      return { ...shared, kind, text: "" }
    case "pomodoro":
      return {
        ...shared,
        kind,
        minutes: 25,
        remainingMs: 25 * 60_000,
        endsAt: null,
        completedOn: "",
        completedToday: 0,
      }
    case "weather":
      return {
        ...shared,
        kind,
        locationName: "",
        latitude: null,
        longitude: null,
        unit: "celsius",
      }
    case "photo":
      return { ...shared, kind, image: "", caption: "", fit: "cover" }
    case "bookmark-list":
      return { ...shared, kind, folderId: "" }
    case "rss":
      return { ...shared, kind, feedUrl: "" }
    case "github-repo":
      return { ...shared, kind, repository: "" }
    case "world-clock":
      return {
        ...shared,
        kind,
        hour12: false,
        zones: [
          { id: "utc", label: "UTC", timeZone: "UTC" },
          { id: "tokyo", label: "Tokyo", timeZone: "Asia/Tokyo" },
          { id: "london", label: "London", timeZone: "Europe/London" },
        ],
      }
  }
}

/** Keep live note/timer state when a settings dialog was opened earlier. */
export function applyUtilityConfiguration(
  current: UtilityWidgetItem,
  draft: UtilityWidgetItem
): UtilityWidgetItem {
  if (current.id !== draft.id || current.kind !== draft.kind) return current
  if (current.kind === "note" && draft.kind === "note")
    return { ...draft, text: current.text }
  if (current.kind === "pomodoro" && draft.kind === "pomodoro") {
    const live =
      current.minutes === draft.minutes
        ? current
        : resetPomodoro({ ...current, minutes: draft.minutes })
    return {
      ...draft,
      endsAt: live.endsAt,
      remainingMs: live.remainingMs,
      completedOn: live.completedOn,
      completedToday: live.completedToday,
    }
  }
  return draft
}
