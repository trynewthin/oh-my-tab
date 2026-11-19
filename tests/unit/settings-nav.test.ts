import { afterEach, describe, expect, test, vi } from "vitest"
import {
  availableSettingsNav,
  collectSettingsRoutes,
  isSettingsRouteId,
  resolveSettingsSection,
  settingsIcons,
  settingsNav,
} from "@/components/settings/settings-routes"
import config from "@/components/settings/settings-nav.json"
import {
  defaultSettingsSection,
  isSettingsSection,
  settingsSections,
} from "@/lib/settings-sections"

describe("settings nav routes", () => {
  afterEach(() => vi.unstubAllGlobals())

  test.each([
    ["chrome-extension:", "popup.html", true],
    ["chrome-extension:", undefined, false],
    ["https:", "popup.html", false],
  ])(
    "guards Popup appearance on %s with manifest popup %s",
    (protocol, popup, available) => {
      vi.stubGlobal("location", { protocol })
      vi.stubGlobal("chrome", {
        runtime: { getManifest: () => ({ action: { default_popup: popup } }) },
      })
      const navigation = availableSettingsNav()
      const ids = collectSettingsRoutes(navigation).map(({ route }) => route.id)
      if (available) {
        expect(ids[ids.indexOf("home-top") + 1]).toBe("popup-appearance")
      } else {
        expect(ids).not.toContain("popup-appearance")
      }
      expect(resolveSettingsSection("popup-appearance", navigation)).toBe(
        available ? "popup-appearance" : defaultSettingsSection
      )
    }
  )

  test("json nav registers unique routes and a valid default", () => {
    const ids = collectSettingsRoutes().map(({ route }) => route.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(isSettingsRouteId(defaultSettingsSection)).toBe(true)
  })

  test("section model stays in sync with the json nav", () => {
    const ids = collectSettingsRoutes().map(({ route }) => route.id)
    expect([...settingsSections].sort()).toEqual(ids.sort())
    expect(defaultSettingsSection).toBe(config.defaultSection)
    for (const id of ids) expect(isSettingsSection(id)).toBe(true)
  })

  test("nav icons are registered", () => {
    for (const node of settingsNav) {
      if (!node.icon) continue
      expect(node.icon in settingsIcons).toBe(true)
    }
  })
})
