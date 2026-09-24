export const utilityWidgetKinds = [
  "clock",
  "countdown",
  "note",
  "pomodoro",
  "weather",
  "photo",
  "bookmark-list",
  "rss",
  "github-repo",
  "world-clock",
] as const

export type UtilityWidgetKind = (typeof utilityWidgetKinds)[number]
export type UtilityWidgetSize =
  "small" | "medium" | "large" | "tall" | "wide" | "wide-tall"

export type CountdownEvent = { id: string; title: string; date: string }
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
    | { kind: "countdown"; events: CountdownEvent[] }
    | { kind: "note"; text: string }
    | {
        kind: "pomodoro"
        minutes: number
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
    | { kind: "bookmark-list"; folderId: string }
    | { kind: "rss"; feedUrl: string }
    | { kind: "github-repo"; repository: string }
    | { kind: "world-clock"; zones: WorldClockZone[]; hour12: boolean }
  )

export type PomodoroItem = Extract<UtilityWidgetItem, { kind: "pomodoro" }>
export type RemoteWidgetItem = Extract<
  UtilityWidgetItem,
  { kind: "weather" | "rss" | "github-repo" }
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
