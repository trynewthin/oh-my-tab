import { describe, expect, it } from "vitest"
import {
  emptyQuickBar,
  normalizeQuickSite,
  placeQuickControl,
  sanitizeQuickBarConfig,
  validQuickBarConfig,
} from "@/lib/quick-bar"
import { snapshot, validateConfig } from "@/application/config-transfer"

describe("quick bar configuration", () => {
  it("starts empty and keeps valid controls in their own regions", () => {
    expect(emptyQuickBar()).toEqual({
      left: [],
      center: { kind: "none" },
      right: [],
    })
    const config = {
      left: [{ id: "theme", kind: "system", action: "toggle-theme" }],
      center: { kind: "text", text: "HELLO" },
      right: [
        {
          id: "site",
          kind: "site",
          name: "Example",
          url: "https://example.com/",
        },
      ],
    }
    expect(validQuickBarConfig(config)).toBe(true)
    expect(sanitizeQuickBarConfig(config)).toEqual(config)
  })

  it("rejects unsafe links and invalid actions while preserving valid entries", () => {
    const saved = {
      left: [
        { id: "bad", kind: "site", name: "Bad", url: "javascript:alert(1)" },
        { id: "theme", kind: "system", action: "toggle-theme" },
      ],
      center: { kind: "text", text: "x".repeat(81) },
      right: [
        { id: "theme", kind: "system", action: "open-settings" },
        { id: "unknown", kind: "system", action: "erase-data" },
      ],
    }
    expect(validQuickBarConfig(saved)).toBe(false)
    expect(sanitizeQuickBarConfig(saved)).toEqual({
      left: [{ id: "theme", kind: "system", action: "toggle-theme" }],
      center: { kind: "none" },
      right: [],
    })
    expect(normalizeQuickSite("Example", "example.com")).toEqual({
      name: "Example",
      url: "https://example.com/",
    })
    expect(normalizeQuickSite("Bad", "javascript:alert(1)")).toBeNull()
  })

  it("includes quick controls in backups and accepts older backups without them", () => {
    const current = JSON.parse(JSON.stringify(snapshot()))
    current.home.layoutMode = "free"
    current.home.quickBar = {
      left: [{ id: "settings", kind: "system", action: "open-settings" }],
      center: { kind: "time" },
      right: [],
    }
    expect(validateConfig(current).home.quickBar).toEqual(current.home.quickBar)

    const legacy = JSON.parse(JSON.stringify(snapshot()))
    delete legacy.home.layoutMode
    delete legacy.home.quickBar
    expect(validateConfig(legacy).home).toMatchObject({
      layoutMode: "traditional",
      quickBar: emptyQuickBar(),
    })
    current.home.quickBar.right = [
      { id: "bad", kind: "site", name: "Bad", url: "javascript:alert(1)" },
    ]
    expect(() => validateConfig(current)).toThrow()
  })

  it("reorders controls and moves them between sides without changing the center", () => {
    const config = {
      left: [
        { id: "a", kind: "system", action: "toggle-theme" },
        { id: "b", kind: "system", action: "open-settings" },
      ],
      center: { kind: "time" },
      right: [{ id: "c", kind: "system", action: "open-components" }],
    } as const
    const ordered = placeQuickControl(
      {
        left: [...config.left],
        center: config.center,
        right: [...config.right],
      },
      "a",
      "left",
      2
    )
    expect(ordered.left.map((control) => control.id)).toEqual(["b", "a"])
    const moved = placeQuickControl(ordered, "c", "left", 1)
    expect(moved.left.map((control) => control.id)).toEqual(["b", "c", "a"])
    expect(moved.right).toEqual([])
    expect(moved.center).toEqual({ kind: "time" })
  })
})
