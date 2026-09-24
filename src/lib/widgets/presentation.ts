import { dateOrdinal, validTimeZone } from "./model"

export type ClockReading = {
  time: string
  seconds: string
  period: string
  spoken: string
  hour: number
  minute: number
  weekday: string
  date: string
}

// Bounded cache: the shared wall clock should not construct several Intl
// formatters for every second and every city. Invalid editor input uses UTC
// for its illustrative preview; persisted values still use model validation.
const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(locale: string, options: Intl.DateTimeFormatOptions) {
  const key = JSON.stringify([locale, options])
  let value = formatters.get(key)
  if (!value) {
    value = new Intl.DateTimeFormat(locale, options)
    if (formatters.size >= 64)
      formatters.delete(formatters.keys().next().value!)
    formatters.set(key, value)
  }
  return value
}

export function clockReading(
  now: number,
  locale: string,
  timeZone = "",
  hour12 = false
): ClockReading {
  const zone = timeZone && validTimeZone(timeZone) ? timeZone : undefined
  const safeZone = timeZone && !zone ? "UTC" : zone
  const timeFormat = formatter(locale, {
    timeZone: safeZone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: hour12 ? "h12" : "h23",
  })
  const parts = timeFormat.formatToParts(now)
  const part = (name: Intl.DateTimeFormatPartTypes) =>
    parts.find((entry) => entry.type === name)?.value ?? ""
  const numeric = formatter("en-GB", {
    timeZone: safeZone,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now)
  return {
    time: `${part("hour")}:${part("minute")}`,
    seconds: part("second"),
    period: part("dayPeriod"),
    spoken: timeFormat.format(now),
    hour: Number(numeric.find((entry) => entry.type === "hour")?.value),
    minute: Number(numeric.find((entry) => entry.type === "minute")?.value),
    weekday: formatter(locale, { timeZone: safeZone, weekday: "long" }).format(
      now
    ),
    date: formatter(locale, {
      timeZone: safeZone,
      month: "short",
      day: "numeric",
    }).format(now),
  }
}

/** A date-only value must not drift into yesterday in a western time zone. */
export function calendarLabel(date: string, locale: string, weekday = false) {
  const ordinal = dateOrdinal(date)
  if (ordinal === null) return "—"
  return formatter(locale, {
    timeZone: "UTC",
    ...(weekday
      ? ({ weekday: "short" } as const)
      : ({ month: "short", day: "numeric" } as const)),
  }).format(ordinal * 86_400_000)
}

export function sourceHost(value: string) {
  try {
    return new URL(value).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

export function weatherCondition(code: number | null) {
  if (code === 0) return "clear"
  if (code !== null && code >= 1 && code <= 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code !== null && code >= 95) return "thunder"
  if (
    code !== null &&
    ((code >= 71 && code <= 77) || code === 85 || code === 86)
  )
    return "snow"
  if (code !== null && code >= 51 && code <= 82) return "rain"
  return "unknown"
}

export function timerProgress(remainingMs: number, minutes: number) {
  const total = minutes * 60_000
  if (!Number.isFinite(total) || total <= 0 || !Number.isFinite(remainingMs))
    return 0
  return Math.max(0, Math.min(1, 1 - remainingMs / total))
}

export function countdownFontSize(value: string, compact: boolean) {
  // Preserve the whole value, including very distant dates, without ellipsis.
  return Math.min(
    compact ? 54 : 82,
    (compact ? 108 : 228) / (Math.max(value.length, 1) * 0.64)
  )
}
