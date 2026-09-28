export const utilityWidgetKinds = [
  "clock",
  "countdown",
  "note",
  "pomodoro",
  "workday",
  "weather",
  "photo",
  "rss",
  "world-clock",
] as const

export type UtilityWidgetKind = (typeof utilityWidgetKinds)[number]
export type UtilityWidgetSize =
  "small" | "medium" | "large" | "tall" | "wide" | "wide-tall"

export type CountdownEvent = { title: string; date: string }
export type WorldClockZone = { id: string; label: string; timeZone: string }

type UtilityBase = {
  id: string
  name: string
  color: string
  size: UtilityWidgetSize
  dynamicEffect?: boolean
}

export type UtilityWidgetItem = UtilityBase &
  (
    | {
        kind: "clock"
        hour12: boolean
        showSeconds: boolean
        timeZone: string
      }
    | { kind: "countdown"; event: CountdownEvent | null }
    | { kind: "note"; text: string }
    | { kind: "workday"; startTime: string; endTime: string }
    | {
        kind: "pomodoro"
        minutes: number
        breakMinutes?: number
        loop?: boolean
        phase?: "focus" | "break"
        remainingMs: number
        endsAt: number | null
        completedOn: string
        completedToday: number
      }
    | {
        kind: "weather"
        locationName: string
        latitude: number | null
        longitude: number | null
        unit: "celsius" | "fahrenheit"
      }
    | {
        kind: "photo"
        image: string
        caption: string
        fit: "cover" | "contain"
      }
    | { kind: "rss"; feedUrl: string }
    | { kind: "world-clock"; zones: WorldClockZone[]; hour12: boolean }
  )

export type PomodoroItem = Extract<UtilityWidgetItem, { kind: "pomodoro" }>
export type RemoteWidgetItem = Extract<
  UtilityWidgetItem,
  { kind: "weather" | "rss" }
>

export function isUtilityWidgetKind(
  value: unknown
): value is UtilityWidgetKind {
  return (
    typeof value === "string" &&
    utilityWidgetKinds.some((kind) => kind === value)
  )
}

export function isUtilityWidget(value: {
  kind?: unknown
}): value is UtilityWidgetItem {
  return isUtilityWidgetKind(value.kind)
}
