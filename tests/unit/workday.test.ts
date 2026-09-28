import { describe, expect, test } from "vitest"
import {
  workdayDigits,
  workdayReading,
  validWorkdaySchedule,
} from "@/lib/widgets/workday"
import { createCatalogComponent } from "@/lib/grid/factory"
import {
  getComponentSizeOptions,
  getItemGridDimensions,
} from "@/lib/grid/registry"
import { validGridItem } from "@/lib/grid/validation"
import { encodeBackup, decodeBackup } from "@/lib/backup-codec"

const schedule = { startTime: "09:00", endTime: "18:00" }
const at = (hour: number, minute = 0, second = 0, ms = 0) =>
  new Date(2026, 8, 28, hour, minute, second, ms).getTime()

describe("clock-out countdown", () => {
  test("offers only the 4x2 size", () => {
    for (const surface of ["catalog", "editor"] as const) {
      expect(
        getComponentSizeOptions("workday", surface).map(({ width, height }) => [
          width,
          height,
        ])
      ).toEqual([[4, 2]])
    }
    expect(getItemGridDimensions(createCatalogComponent("workday"))).toEqual({
      width: 4,
      height: 2,
    })
  })
  test("moves through before-work, work, and completion at exact local boundaries", () => {
    expect(workdayReading(schedule, at(8))).toMatchObject({
      phase: "before",
      remainingMs: 3_600_000,
      progress: 0,
      celebrating: false,
    })
    expect(workdayReading(schedule, at(9))).toMatchObject({
      phase: "working",
      remainingMs: 9 * 3_600_000,
      progress: 0,
    })
    expect(workdayReading(schedule, at(13, 30)).progress).toBe(0.5)
    expect(workdayReading(schedule, at(17, 59, 59, 999))).toMatchObject({
      phase: "working",
      remainingMs: 1,
    })
    expect(workdayReading(schedule, at(18))).toMatchObject({
      phase: "done",
      remainingMs: 0,
      progress: 1,
      celebrating: true,
    })
    expect(workdayReading(schedule, at(18, 0, 4)).celebrating).toBe(false)
    expect(workdayReading(schedule, at(24))).toMatchObject({
      phase: "before",
      remainingMs: 9 * 3_600_000,
    })
  })

  test("overnight shifts stay continuous at midnight and end the following morning", () => {
    const night = { startTime: "22:00", endTime: "06:00" }
    const evening = workdayReading(night, at(23))
    const midnight = workdayReading(night, at(24))
    expect(evening).toMatchObject({
      phase: "working",
      remainingMs: 7 * 3_600_000,
    })
    expect(midnight).toMatchObject({
      phase: "working",
      remainingMs: 6 * 3_600_000,
      end: evening.end,
    })
    expect(workdayReading(night, at(6))).toMatchObject({
      phase: "done",
      celebrating: true,
    })
    expect(workdayReading(night, at(15))).toMatchObject({
      phase: "done",
      celebrating: false,
    })
    expect(workdayReading(night, at(22))).toMatchObject({
      phase: "working",
      remainingMs: 8 * 3_600_000,
    })
  })

  test("formatting uses actual millisecond remainder and never becomes negative", () => {
    expect(workdayDigits(3_723_456)).toEqual({
      time: "01:02:03",
      fraction: "456",
    })
    expect(workdayDigits(1)).toEqual({ time: "00:00:00", fraction: "001" })
    expect(workdayDigits(-1)).toEqual({ time: "00:00:00", fraction: "000" })
  })

  test("accepts daily and overnight schedules and rejects ambiguous or malformed times", () => {
    expect(validWorkdaySchedule(schedule)).toBe(true)
    expect(validWorkdaySchedule({ startTime: "22:00", endTime: "00:00" })).toBe(
      true
    )
    for (const startTime of [
      "",
      "9:00",
      "24:00",
      "09:60",
      "09:00:00",
      "18:00",
    ]) {
      expect(validWorkdaySchedule({ ...schedule, startTime })).toBe(false)
      expect(
        validGridItem({
          ...createCatalogComponent("workday"),
          startTime,
          endTime: "18:00",
        })
      ).toBe(false)
    }
  })

  test("configured schedules round-trip through ZIP backups", async () => {
    const item = {
      ...createCatalogComponent("workday"),
      startTime: "22:00",
      endTime: "06:00",
    }
    expect(validGridItem(item)).toBe(true)
    const config = { grid: { items: [item], layouts: {} } }
    expect((await decodeBackup(await encodeBackup(config))).config).toEqual(
      config
    )
  })
})
