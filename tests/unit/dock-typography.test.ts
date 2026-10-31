import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { describe, expect, test, vi } from "vitest"
import ButtonSlot from "@/components/tab-grid/button-slot"
import TabContent from "@/components/tab-grid/tab-content"
import {
  useTabAppearance,
  useTabStyle,
} from "@/components/tab-grid/use-tab-style"
import { sanitizeTabAppearance } from "@/lib/tab-appearance"
import type { ButtonSlotItem } from "@/lib/grid/types"

vi.mock("@/components/tab-grid/use-tab-style", () => ({
  useTabAppearance: vi.fn(),
  useTabStyle: vi.fn(),
}))

describe("shortcut dock typography", () => {
  test.each([12, 24, 36])(
    "uses the same %ipx text appearance as tabs",
    (fontSize) => {
      const appearance = sanitizeTabAppearance({
        fontSize,
        fontFamily: "mono",
        fontWeight: 700,
        textColor: "#123456",
        textOpacity: 65,
        letterSpacing: 2,
        lineHeight: 1.5,
      })
      vi.mocked(useTabAppearance).mockReturnValue(appearance)
      vi.mocked(useTabStyle).mockReturnValue({
        appearance,
        texture: "none",
        coverage: 0,
      })
      const item: ButtonSlotItem = {
        id: "dock",
        kind: "button-slot",
        size: "wide",
        name: "Work",
        color: "#123456",
        controls: [],
      }
      const dock = renderToStaticMarkup(createElement(ButtonSlot, { item }))
      const tab = renderToStaticMarkup(
        createElement(TabContent, {
          name: item.name,
          size: "small",
          icon: null,
          appearance,
        })
      )
      for (const style of [
        `font-size:${fontSize}px`,
        "font-family:ui-monospace, SFMono-Regular, Menlo, monospace",
        "font-weight:700",
        "color:#123456",
        "opacity:0.65",
        "letter-spacing:2px",
        "line-height:1.5",
      ]) {
        expect(dock).toContain(style)
        expect(tab).toContain(style)
      }
    }
  )
})
