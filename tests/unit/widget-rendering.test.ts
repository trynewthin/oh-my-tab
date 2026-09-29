import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, describe, expect, test, vi } from "vitest"
import UtilityWidgetTile from "@/components/tab-grid/utility-widget-tile"
import { WidgetTile } from "@/components/tab-grid/widget-ui"
import { createCatalogComponent } from "@/lib/grid/factory"
import { getComponentSizeOptions } from "@/lib/grid/registry"
import { isUtilityWidget, utilityWidgetKinds } from "@/lib/grid/utility-types"
import { i18n } from "@/i18n"
import { localDateKey } from "@/lib/widgets/model"

vi.mock("@/components/effects/use-wall-clock", () => ({
  useWallClock: () => Date.UTC(2026, 0, 15, 10, 8),
}))

vi.mock("@/components/tab-grid/shared/component-background", () => ({
  default: ({ animated = false }: { animated?: boolean }) =>
    createElement("div", {
      "data-test-background": true,
      "data-animated": animated ? "true" : undefined,
    }),
}))
vi.mock("@/stores/tab-grid-store", () => ({
  useTabGridStore: (selector: (state: { items: never[] }) => unknown) =>
    selector({ items: [] }),
}))
vi.mock("@/stores/matrix-renderer-store", () => ({
  useMatrixRendererStore: () => "dom",
}))

afterEach(() => vi.unstubAllGlobals())

// Server rendering only: does not launch a browser or claim layout/visual QA.
describe("widget render contracts", () => {
  test("folder backgrounds stay static when their tabs are animated", () => {
    const html = renderToStaticMarkup(
      createElement(WidgetTile, {
        item: {
          id: "folder",
          kind: "folder",
          name: "Folder",
          size: "large",
          color: "#6c8bd4",
          tabs: [],
          dynamicEffect: true,
        },
        preview: true,
        onOpen: () => {},
      })
    )
    expect(html).toContain("data-test-background")
    expect(html).not.toContain('data-animated="true"')
  })

  test.each(["small", "medium", "tall"] as const)(
    "clock %s shows only the time on a transparent surface in both styles",
    async (size) => {
      await i18n.changeLanguage("en")
      const item = createCatalogComponent("clock", size)
      if (item.kind !== "clock") throw new Error("Expected clock")
      for (const effect of ["plain", "dots"] as const) {
        const html = renderToStaticMarkup(
          createElement(UtilityWidgetTile, {
            item: {
              ...item,
              effect,
              timeZone: "Asia/Tokyo",
            },
            preview: true,
            sample: true,
            onOpen: () => {},
          })
        )
        expect(html).toContain('aria-label="19:08"')
        expect(html).not.toContain("data-test-background")
        expect(html).not.toContain("utility-header")
        expect(html).not.toContain("utility-clock-date")
        expect(html.includes("<svg")).toBe(effect === "dots")
        if (effect === "dots") {
          expect(html).toContain('fill="var(--muted)"')
          expect(html.match(/<svg/g)).toHaveLength(1)
        }
        expect(html).not.toContain("utility-clock-seconds")
        expect(html).not.toContain("utility-clock-period")
        expect(html).not.toContain("<button")
      }
    }
  )
  test("clock-out preview shows milliseconds without interactive controls", () => {
    const item = createCatalogComponent("workday")
    if (item.kind !== "workday") throw new Error("Expected workday")
    const html = renderToStaticMarkup(
      createElement(UtilityWidgetTile, {
        item: { ...item, startTime: "09:00", endTime: "18:00" },
        preview: true,
        sample: true,
        onOpen: () => {},
      })
    )
    expect(html).toContain("04:29:59")
    expect(html).toContain(".877")
    expect(html).toContain('data-phase="working"')
    expect(html).not.toContain("data-celebrating")
    expect(html).not.toContain("<button")
  })
  for (const language of ["en", "zh-CN"]) {
    test(`all catalog sizes render readable, non-interactive ${language} previews`, async () => {
      await i18n.changeLanguage(language)
      const fetch = vi.fn()
      vi.stubGlobal("fetch", fetch)
      for (const kind of utilityWidgetKinds) {
        for (const size of getComponentSizeOptions(kind, "catalog")) {
          const item = createCatalogComponent(kind, size.value)
          if (!isUtilityWidget(item)) throw new Error("Expected utility widget")
          const html = renderToStaticMarkup(
            createElement(UtilityWidgetTile, {
              item,
              preview: true,
              sample: true,
              onOpen: () => {},
            })
          )
          expect(html).toContain(`data-utility-widget="${kind}"`)
          expect(html).not.toMatch(
            /NaN|Invalid Date|widgets\.(design|conditions)/
          )
          expect(html).not.toMatch(/<(button|input|textarea|select|a)(\s|>)/)
        }
      }
      expect(fetch).not.toHaveBeenCalled()
    })
  }
  test("editor preview keeps note text rather than replacing it with sample copy", () => {
    const item = createCatalogComponent("note", "large")
    if (item.kind !== "note") throw new Error("Expected note")
    const html = renderToStaticMarkup(
      createElement(UtilityWidgetTile, {
        item: { ...item, text: "My actual note" },
        preview: true,
        sample: false,
        onOpen: () => {},
      })
    )
    expect(html).toContain("My actual note")
  })
  test.each(["small", "wide"] as const)(
    "empty countdown %s uses only the add-event prompt",
    (size) => {
      const item = createCatalogComponent("countdown", size)
      if (item.kind !== "countdown") throw new Error("Expected countdown")
      for (const preview of [false, true]) {
        const html = renderToStaticMarkup(
          createElement(UtilityWidgetTile, {
            item,
            preview,
            sample: preview,
            onOpen: () => {},
          })
        )
        expect(html).toContain('class="utility-countdown-empty"')
        expect(html).toContain(i18n.t("widgets.addEvent"))
        expect(html).not.toContain("utility-header")
        expect(html).not.toContain(i18n.t("widgets.design.addDate"))
        expect(html).not.toContain(i18n.t("widgets.design.countdownHint"))
        expect(html).not.toContain(i18n.t("widgets.design.eventPreview"))
        expect(html.includes("<button")).toBe(!preview)
      }
    }
  )
  test("read-only timer previews retain real time, phase and completed count", () => {
    const item = createCatalogComponent("pomodoro", "large")
    if (item.kind !== "pomodoro") throw new Error("Expected pomodoro")
    const now = Date.UTC(2026, 0, 15, 10, 8)
    for (const phase of ["focus", "break"] as const) {
      const html = renderToStaticMarkup(
        createElement(UtilityWidgetTile, {
          item: {
            ...item,
            phase,
            breakMinutes: 5,
            endsAt: now + 90_000,
            completedOn: localDateKey(now),
            completedToday: 7,
          },
          preview: true,
          onOpen: () => {},
        })
      )
      expect(html).toContain('role="timer" aria-live="off">01:30</span>')
      expect(html).toContain(i18n.t("widgets.sessionsToday", { count: 7 }))
      expect(html).toContain(
        i18n.t(phase === "break" ? "widgets.breakPhase" : "widgets.workPhase")
      )
      expect(html).not.toMatch(/<(button|input|textarea|select|a)(\s|>)/)
    }
  })
  test.each(["small", "wide"] as const)(
    "countdown %s automatically counts past and future dates",
    (size) => {
      const item = createCatalogComponent("countdown", size)
      if (item.kind !== "countdown") throw new Error("Expected countdown")
      for (const [date, days] of [
        ["2026-01-12", 3, "widgets.design.elapsed"],
        ["2026-01-15", 0, "widgets.today"],
        ["2026-01-20", 5, "widgets.design.remaining"],
      ] as const) {
        const html = renderToStaticMarkup(
          createElement(UtilityWidgetTile, {
            item: {
              ...item,
              event: { title: "Anniversary", date },
            },
            preview: true,
            onOpen: () => {},
          })
        )
        expect(html).toContain(`<strong>${days}</strong>`)
        if (size === "wide")
          expect(html).toContain(`<span>${i18n.t("widgets.dayUnit")}</span>`)
        else {
          expect(html).not.toContain("<time")
          expect(html).not.toContain(
            `<span>${i18n.t("widgets.dayUnit")}</span>`
          )
        }
        expect(html).toContain("Anniversary")
      }
    }
  )
  test("pomodoro shows remaining time and essential controls without extra copy", async () => {
    await i18n.changeLanguage("en")
    const item = createCatalogComponent("pomodoro", "large")
    if (item.kind !== "pomodoro") throw new Error("Expected pomodoro")
    for (const running of [false, true]) {
      const html = renderToStaticMarkup(
        createElement(UtilityWidgetTile, {
          item: {
            ...item,
            remainingMs: 90_000,
            endsAt: running ? Date.UTC(2026, 0, 15, 10, 9, 30) : null,
          },
          onOpen: () => {},
        })
      )
      expect(html).toContain('role="timer" aria-live="off">01:30</span>')
      expect(html).toContain(
        `aria-label="${i18n.t(running ? "widgets.pause" : "widgets.start")}"`
      )
      expect(html).toContain(`aria-label="${i18n.t("widgets.stop")}"`)
      expect(html).not.toContain("utility-header")
      expect(html).not.toContain("utility-footer")
      expect(html).not.toContain("utility-eyebrow")
      expect(html).toContain(
        `aria-label="${i18n.t("widgets.sessionsToday", { count: 0 })}"`
      )
    }
  })
})
