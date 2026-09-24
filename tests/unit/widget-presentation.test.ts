import { describe, expect, test } from "vitest"
import {
  calendarLabel,
  clockReading,
  countdownFontSize,
  sourceHost,
  timerProgress,
  weatherCondition,
} from "@/lib/widgets/presentation"
import { gridOccupancyBox } from "@/lib/grid/grid-layout"

const now = Date.UTC(2026, 0, 15, 23, 8, 42)

describe("widget presentation", () => {
  test("separates secondary seconds and period without losing localized time", () => {
    const value = clockReading(now, "en-US", "UTC", true)
    expect(value).toMatchObject({
      time: "11:08",
      seconds: "42",
      period: "PM",
      hour: 23,
      minute: 8,
    })
    expect(clockReading(now, "zh-CN", "Asia/Tokyo").time).toBe("08:08")
    expect(clockReading(now, "en-GB", "UTC").date).toContain("15")
  })
  test("uses h23 rather than displaying midnight as 24", () => {
    const value = clockReading(Date.UTC(2026, 0, 16), "en-US", "UTC")
    expect(value.time).toBe("00:00")
    expect(value.hour).toBe(0)
  })
  test("handles temporarily invalid editor time zones without crashing", () => {
    expect(() => clockReading(now, "en", "Asia/")).not.toThrow()
    expect(clockReading(now, "en", "Asia/").time).toBe(
      clockReading(now, "en", "UTC").time
    )
  })
  test("formats date-only labels without applying the device time zone", () => {
    expect(calendarLabel("2026-01-15", "en-US")).toBe("Jan 15")
    expect(calendarLabel("2026-01-15", "en-US", true)).toBe("Thu")
    expect(calendarLabel("2026-02-30", "en-US")).toBe("—")
  })
  test("clamps the progress ring, including malformed draft input", () => {
    expect(timerProgress(25 * 60_000, 25)).toBe(0)
    expect(timerProgress(0, 25)).toBe(1)
    expect(timerProgress(12.5 * 60_000, 25)).toBe(0.5)
    expect(timerProgress(-1000, 25)).toBe(1)
    expect(timerProgress(20, 0)).toBe(0)
    expect(timerProgress(Number.NaN, 25)).toBe(0)
  })
  test("long countdown values keep every digit rather than truncating", () => {
    expect(countdownFontSize("7", true)).toBe(54)
    expect(countdownFontSize("1234567", true)).toBeLessThan(25)
    expect(countdownFontSize("1234567", false)).toBeGreaterThan(40)
  })
  test("does not invent a weather condition for missing data", () => {
    expect(weatherCondition(null)).toBe("unknown")
    expect(weatherCondition(0)).toBe("clear")
    expect(weatherCondition(2)).toBe("cloudy")
    expect(weatherCondition(45)).toBe("fog")
    expect(weatherCondition(61)).toBe("rain")
    expect(weatherCondition(85)).toBe("snow")
    expect(weatherCondition(95)).toBe("thunder")
  })
  test("matches existing pixel geometry; one grid unit is not a card", () => {
    expect(gridOccupancyBox(0, 4, 1)).toEqual({ width: 286, height: 59.5 })
    expect(gridOccupancyBox(0, 4, 2)).toEqual({ width: 286, height: 135 })
    expect(gridOccupancyBox(0, 4, 4)).toEqual({ width: 286, height: 286 })
    expect(gridOccupancyBox(0, 8, 4)).toEqual({ width: 588, height: 286 })
  })
  test("shows a hostname without exposing a feed query in labels", () => {
    expect(sourceHost("https://www.example.com/feed?private=value")).toBe(
      "example.com"
    )
    expect(sourceHost("not a URL")).toBe("")
  })
})
