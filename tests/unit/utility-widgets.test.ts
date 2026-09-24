import { describe, expect, test } from "vitest"
import { createCatalogComponent } from "@/lib/grid/factory"
import {
  catalogComponentKinds,
  getComponentSizeOptions,
  getItemGridDimensions,
} from "@/lib/grid/registry"
import { utilityWidgetKinds, type PomodoroItem } from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import {
  applyUtilityConfiguration,
  completePomodoro,
  createUtilityWidget,
  dateOrdinal,
  daysUntil,
  formatDuration,
  NOTE_MAX_LENGTH,
  remainingTime,
  remoteUrl,
  resetPomodoro,
  togglePomodoro,
  validPhoto,
  validTimeZone,
} from "@/lib/widgets/model"
import { parseWeather, widgetRequestUrl } from "@/lib/widgets/network"

const shared = {
  id: "widget",
  name: "Widget",
  color: "#123456",
  size: "large" as const,
}

const timer = (): PomodoroItem => ({
  ...shared,
  kind: "pomodoro",
  minutes: 25,
  remainingMs: 1_500_000,
  endsAt: null,
  completedOn: "",
  completedToday: 0,
})

describe("utility widgets", () => {
  test("keeps the nine approved widgets and rejects the removed kind", () => {
    expect(utilityWidgetKinds).toEqual([
      "clock",
      "countdown",
      "note",
      "pomodoro",
      "weather",
      "photo",
      "bookmark-list",
      "rss",
      "world-clock",
    ])
    expect(catalogComponentKinds).not.toContain("github-repo")
    expect(
      validGridItem({ ...shared, kind: "github-repo", repository: "a/b" })
    ).toBe(false)
  })

  test.each(utilityWidgetKinds)("%s creates valid registered sizes", (kind) => {
    for (const option of getComponentSizeOptions(kind, "catalog")) {
      const item = createCatalogComponent(kind, option.value)
      expect(validGridItem(JSON.parse(JSON.stringify(item)))).toBe(true)
      expect(getItemGridDimensions(item)).toEqual({
        width: option.width,
        height: option.height,
      })
      expect(option.width).toBeGreaterThanOrEqual(4)
    }
  })

  test("rejects invalid persisted fields", () => {
    const countdown = createUtilityWidget("countdown", shared)
    const invalid = [
      {
        ...createUtilityWidget("note", shared),
        text: "x".repeat(NOTE_MAX_LENGTH + 1),
      },
      {
        ...createUtilityWidget("clock", shared),
        timeZone: "Mars/Olympus",
      },
      {
        ...countdown,
        events: [{ id: "a", title: "Trip", date: "2026-02-30" }],
      },
      { ...timer(), minutes: 0 },
      {
        ...createUtilityWidget("weather", shared),
        latitude: 91,
        longitude: 0,
      },
      {
        ...createUtilityWidget("photo", shared),
        image: "https://example.com/photo.png",
      },
      {
        ...createUtilityWidget("world-clock", shared),
        zones: [],
      },
      {
        ...createUtilityWidget("rss", { ...shared, size: "wide" }),
        feedUrl: "https://127.0.0.1/feed",
      },
    ]
    invalid.forEach((item) => expect(validGridItem(item)).toBe(false))
  })

  test("calendar dates and focus timers remain deterministic", () => {
    expect(dateOrdinal("2024-02-29")).not.toBeNull()
    expect(dateOrdinal("2026-02-29")).toBeNull()
    expect(daysUntil("2026-03-09", new Date(2026, 2, 8, 23, 59))).toBe(1)
    expect(validTimeZone("Asia/Tokyo")).toBe(true)

    const now = new Date(2026, 8, 24, 12).getTime()
    const started = togglePomodoro(timer(), now)
    const restored = JSON.parse(JSON.stringify(started)) as PomodoroItem
    expect(remainingTime(restored, now + 10_000)).toBe(1_490_000)
    const paused = togglePomodoro(restored, now + 10_000)
    const resumed = togglePomodoro(paused, now + 100_000)
    const done = completePomodoro(resumed, resumed.endsAt! + 1)
    expect(done.completedToday).toBe(1)
    expect(completePomodoro(done, now + 10_000_000)).toBe(done)
    expect(resetPomodoro(done).remainingMs).toBe(1_500_000)
    expect(formatDuration(1)).toBe("00:01")
  })

  test("settings keep live note and timer state", () => {
    const live = togglePomodoro(timer(), 1000)
    expect(
      applyUtilityConfiguration(live, { ...timer(), name: "Focus" })
    ).toMatchObject({ name: "Focus", endsAt: live.endsAt })

    const note = { ...shared, kind: "note" as const, text: "latest" }
    expect(
      applyUtilityConfiguration(note, {
        ...note,
        text: "stale",
        name: "Renamed",
      })
    ).toMatchObject({ name: "Renamed", text: "latest" })
  })

  test("remote sources and response schemas are bounded", () => {
    for (const url of [
      "http://example.com/feed",
      "https://user:pass@example.com/feed",
      "https://127.0.0.1/feed",
      "https://[::1]/feed",
      "https://localhost/feed",
      "https://router.local/feed",
      "https://example.com:444/feed",
    ])
      expect(remoteUrl(url)).toBeNull()

    expect(remoteUrl("https://example.com/feed#item")).toBe(
      "https://example.com/feed"
    )
    expect(validPhoto("data:image/svg+xml;base64,PHN2Zz4=")).toBe(false)

    const weatherUrl = new URL(
      widgetRequestUrl({
        id: "w",
        name: "Weather",
        color: "#123456",
        size: "large",
        kind: "weather",
        latitude: 35.68,
        longitude: 139.69,
        locationName: "Tokyo",
        unit: "celsius",
      })
    )
    expect(weatherUrl.origin).toBe("https://api.open-meteo.com")
    expect(weatherUrl.searchParams.get("forecast_days")).toBe("3")
    expect(
      parseWeather({
        current: { temperature_2m: 22, weather_code: 0 },
        daily: {
          time: ["2026-09-24"],
          temperature_2m_max: [25],
          temperature_2m_min: [18],
        },
      }).forecast
    ).toEqual([{ date: "2026-09-24", high: 25, low: 18 }])
  })
})
