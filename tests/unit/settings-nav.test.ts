import { describe, expect, test } from "vitest"
import {
  collectSettingsRoutes,
  isSettingsRouteId,
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
