import { describe, expect, test } from "vitest"
import { createCatalogComponent } from "@/lib/grid/factory"
import {
  catalogComponentKinds,
  getComponentSizeOptions,
  getItemGridDimensions,
} from "@/lib/grid/registry"
import { utilityWidgetKinds, type PomodoroItem } from "@/lib/grid/utility-types"
import { validGridItem } from "@/lib/grid/validation"
import { encodeBackup, decodeBackup } from "@/lib/backup-codec"
import {
  applyUtilityConfiguration,
  completePomodoro,
  createUtilityWidget,
  dateOrdinal,
  daysUntil,
  formatDuration,
  localDateKey,
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
  test("countdown offers only square 2x2 and horizontal 4x1 sizes", () => {
    expect(
      getComponentSizeOptions("countdown", "catalog").map(
        ({ width, height }) => [width, height]
      )
    ).toEqual([
      [2, 2],
      [4, 1],
    ])
    expect(getItemGridDimensions(createCatalogComponent("countdown"))).toEqual({
      width: 2,
      height: 2,
    })
  })
  test("keeps supported widgets and rejects removed kinds", () => {
    expect(utilityWidgetKinds).toEqual([
      "clock",
      "countdown",
      "note",
      "pomodoro",
      "workday",
      "weather",
      "photo",
      "rss",
      "world-clock",
    ])
    expect(catalogComponentKinds).not.toContain("github-repo")
    expect(catalogComponentKinds).toContain("pomodoro")
    expect(catalogComponentKinds).toContain("countdown")
    for (const kind of utilityWidgetKinds.filter(
      (kind) =>
        kind !== "pomodoro" &&
        kind !== "countdown" &&
        kind !== "workday" &&
        kind !== "clock"
    ))
      expect(catalogComponentKinds).not.toContain(kind)
    expect(
      validGridItem({ ...shared, kind: "github-repo", repository: "a/b" })
    ).toBe(false)
    expect(validGridItem({ ...shared, kind: "bookmark-list" })).toBe(false)
    expect(validGridItem({ ...shared, kind: "search-full" })).toBe(false)
  })

  test.each(utilityWidgetKinds)("%s creates valid registered sizes", (kind) => {
    for (const option of getComponentSizeOptions(kind, "catalog")) {
      const item = createCatalogComponent(kind, option.value)
      expect(validGridItem(JSON.parse(JSON.stringify(item)))).toBe(true)
      expect(getItemGridDimensions(item)).toEqual({
        width: option.width,
        height: option.height,
      })
      expect(option.width).toBeGreaterThanOrEqual(
        kind === "countdown" || kind === "clock" ? 2 : 4
      )
    }
  })

  test("rejects invalid persisted fields", () => {
    const countdown = createUtilityWidget("countdown", {
      ...shared,
      size: "small",
    })
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
        event: { title: "Trip", date: "2026-02-30" },
      },
      { ...timer(), minutes: 0 },
      { ...createCatalogComponent("clock"), effect: "unknown" },
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

  test("single focus and break cycle stops after the break", () => {
    const start = togglePomodoro({ ...timer(), breakMinutes: 30 }, 0)
    const rest = completePomodoro(start, 1_500_000)
    expect(rest).toMatchObject({
      phase: "break",
      endsAt: 3_300_000,
      completedToday: 1,
    })
    expect(remainingTime(rest, 1_500_000)).toBe(1_800_000)
    expect(validGridItem(rest)).toBe(true)
    const paused = togglePomodoro(rest, 1_560_000)
    expect(paused).toMatchObject({
      phase: "break",
      endsAt: null,
      remainingMs: 1_740_000,
    })
    const resumed = togglePomodoro(paused, 2_000_000)
    const done = completePomodoro(resumed, resumed.endsAt!)
    expect(done).toMatchObject({
      phase: "focus",
      endsAt: null,
      remainingMs: 0,
      completedToday: 1,
    })
    expect(togglePomodoro(done, 4_000_000).endsAt).toBe(5_500_000)
    expect(resetPomodoro(rest)).toMatchObject({
      phase: "focus",
      endsAt: null,
      remainingMs: 1_500_000,
    })
  })

  test.each([0, 5])(
    "looping timer recovers elapsed cycles with %s minute breaks",
    (breakMinutes) => {
      const now = new Date(2026, 8, 24, 12).getTime()
      const period = (25 + breakMinutes) * 60_000
      const start = togglePomodoro(
        { ...timer(), loop: true, breakMinutes },
        now
      )
      const restored = completePomodoro(start, now + period * 3 + 10_000)
      expect(restored).toMatchObject({
        phase: "focus",
        endsAt: now + period * 3 + 1_500_000,
        completedToday: 3,
      })
      expect(remainingTime(restored, now + period * 3 + 10_000)).toBe(1_490_000)
      expect(completePomodoro(restored, now + period * 3 + 10_000)).toBe(
        restored
      )
      const boundary = completePomodoro(start, start.endsAt!)
      expect(boundary.phase).toBe(breakMinutes ? "break" : "focus")
      const nextFocus = completePomodoro(boundary, now + period)
      expect(nextFocus).toMatchObject({
        phase: "focus",
        endsAt: now + period + 1_500_000,
        completedToday: 1,
      })
    }
  )

  test("loop recovery counts only focus completions on the latest completion date", () => {
    const now = new Date(2026, 8, 24, 23, 30).getTime()
    const start = togglePomodoro(
      { ...timer(), loop: true, breakMinutes: 5 },
      now
    )
    const nextDay = new Date(2026, 8, 25, 1, 10).getTime()
    expect(completePomodoro(start, nextDay)).toMatchObject({
      completedOn: localDateKey(nextDay),
      completedToday: 2,
    })
    const yearsLater = completePomodoro(start, now + 10 * 365 * 86_400_000)
    expect(validGridItem(yearsLater)).toBe(true)
    expect(yearsLater.endsAt).toBeGreaterThan(now + 10 * 365 * 86_400_000)
  })

  test("configuration preserves the live phase and resets changed durations", () => {
    const original = { ...timer(), breakMinutes: 5, loop: true }
    const rest = completePomodoro(togglePomodoro(original, 0), 1_500_000)
    const edited = applyUtilityConfiguration(rest, { ...original, loop: false })
    expect(edited).toMatchObject({
      phase: "break",
      loop: false,
      endsAt: rest.endsAt,
    })
    expect(
      applyUtilityConfiguration(rest, { ...original, breakMinutes: 0 })
    ).toMatchObject({ phase: "focus", remainingMs: 1_500_000, endsAt: null })
    expect(
      applyUtilityConfiguration(rest, { ...original, minutes: 10 })
    ).toMatchObject({ phase: "focus", remainingMs: 600_000, endsAt: null })
  })

  test("legacy and current timer state survive ZIP backup", async () => {
    const legacy = timer()
    const rest = completePomodoro(
      togglePomodoro({ ...timer(), breakMinutes: 5, loop: true }, 0),
      1_500_000
    )
    const config = { items: [legacy, rest] }
    const restored = await decodeBackup(await encodeBackup(config))
    expect(restored.config).toEqual(config)
    expect(validGridItem(legacy)).toBe(true)
    expect(validGridItem(rest)).toBe(true)
    for (const fields of [
      { breakMinutes: -1 },
      { breakMinutes: 181 },
      { breakMinutes: 0.5 },
      { loop: "yes" },
      { phase: "invalid" },
      { phase: "break", breakMinutes: 0 },
    ]) {
      expect(validGridItem({ ...legacy, ...fields })).toBe(false)
    }
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
