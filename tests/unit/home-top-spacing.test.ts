import { describe, expect, test } from "vitest"

import { snapshot, validateConfig } from "@/application/config-transfer"
import {
  defaultTraditionalTopSpacing,
  traditionalTopInsets,
} from "@/lib/home-top-spacing"

describe("personalized top spacing", () => {
  test("keeps the existing far layout and moves the first visible content upward", () => {
    expect(defaultTraditionalTopSpacing).toBe("far")
    expect(traditionalTopInsets("far", true)).toEqual({
      topPadding: 80,
      searchGap: 24,
    })
    expect(traditionalTopInsets("middle", true)).toEqual({
      topPadding: 48,
      searchGap: 24,
    })
    expect(traditionalTopInsets("near", true)).toEqual({
      topPadding: 24,
      searchGap: 24,
    })
    expect(traditionalTopInsets("far", false)).toEqual({
      topPadding: 24,
      searchGap: 24,
    })
    expect(traditionalTopInsets("near", false)).toEqual({
      topPadding: 24,
      searchGap: 0,
    })
  })

  test("accepts a saved preset and defaults older backups to far", () => {
    const current = JSON.parse(JSON.stringify(snapshot()))
    current.home.traditionalTopSpacing = "near"
    expect(validateConfig(current).home.traditionalTopSpacing).toBe("near")

    const legacy = JSON.parse(JSON.stringify(snapshot()))
    delete legacy.home.traditionalTopSpacing
    expect(validateConfig(legacy).home.traditionalTopSpacing).toBe("far")

    const invalid = JSON.parse(JSON.stringify(snapshot()))
    invalid.home.traditionalTopSpacing = "extra-far"
    expect(() => validateConfig(invalid)).toThrow()
  })
})
