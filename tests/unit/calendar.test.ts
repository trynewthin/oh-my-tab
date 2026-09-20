import { describe, expect, it } from "vitest"
import { weekdayOrder } from "@/components/tab-grid/calendar-utils"

describe("calendar weekday labels", () => {
  it("uses a single-character Sunday label in compact Chinese calendars", () => {
    expect(weekdayOrder("zh-CN", "narrow")).toEqual([
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "日",
    ])
  })
})
