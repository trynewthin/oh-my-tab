import { describe, expect, test } from "vitest"

import enCore from "@/i18n/locales/en/core"
import enGrid from "@/i18n/locales/en/grid"
import enSettings from "@/i18n/locales/en/settings"
import enShell from "@/i18n/locales/en/shell"
import zhCore from "@/i18n/locales/zh-CN/core"
import zhGrid from "@/i18n/locales/zh-CN/grid"
import zhSettings from "@/i18n/locales/zh-CN/settings"
import zhShell from "@/i18n/locales/zh-CN/shell"
import {
  LANGUAGE_PREFERENCES,
  isLanguagePreference,
  resolveAppLanguage,
} from "@/i18n/language"

// Each module is mounted under its own top-level key, so a key added to only
// one language renders the fallback (or a raw key) in the other. These assert
// the shape, not the wording.
const modules = {
  core: [zhCore, enCore],
  settings: [zhSettings, enSettings],
  grid: [zhGrid, enGrid],
  shell: [zhShell, enShell],
} as const

function keyPaths(value: unknown, prefix = ""): string[] {
  if (!value || typeof value !== "object") return [prefix]
  return Object.entries(value).flatMap(([key, child]) =>
    keyPaths(child, prefix ? `${prefix}.${key}` : key)
  )
}

describe("locale key parity", () => {
  for (const [name, [zh, en]] of Object.entries(modules))
    test(`${name} exposes identical keys in both languages`, () => {
      expect(keyPaths(zh).sort()).toEqual(keyPaths(en).sort())
    })
})

describe("language resolution", () => {
  test("an explicit preference wins over the browser", () => {
    expect(resolveAppLanguage("en", ["zh-CN"])).toBe("en")
    expect(resolveAppLanguage("zh-CN", ["en-US"])).toBe("zh-CN")
  })

  test("system follows the browser and falls back to zh-CN", () => {
    expect(resolveAppLanguage("system", ["en-US", "zh"])).toBe("en")
    expect(resolveAppLanguage("system", ["zh-CN"])).toBe("zh-CN")
    // Traditional Chinese and unknown languages are unsupported: both settle
    // on the default rather than resolving to a half-translated UI.
    expect(resolveAppLanguage("system", ["zh-TW"])).toBe("zh-CN")
    expect(resolveAppLanguage("system", ["fr-FR"])).toBe("zh-CN")
    expect(resolveAppLanguage("system", [])).toBe("zh-CN")
  })

  test("only the three documented preferences are accepted", () => {
    expect([...LANGUAGE_PREFERENCES]).toEqual(["system", "zh-CN", "en"])
    for (const value of LANGUAGE_PREFERENCES)
      expect(isLanguagePreference(value)).toBe(true)
    expect(isLanguagePreference("en-US")).toBe(false)
    expect(isLanguagePreference(null)).toBe(false)
  })
})
