import { describe, expect, test } from "vitest"
import {
  collectSettingsRoutes,
  defaultSettingsSection,
  isSettingsRouteId,
  settingsIcons,
  settingsNav,
} from "@/components/settings/settings-routes"

describe("settings nav routes", () => {
  test("json nav registers unique routes and a valid default", () => {
    const ids = collectSettingsRoutes().map(({ route }) => route.id)
    expect(new Set(ids).size).toBe(ids.length)
    expect(isSettingsRouteId(defaultSettingsSection)).toBe(true)
  })

  test("nav icons are registered", () => {
    for (const node of settingsNav) {
      if (!node.icon) continue
      expect(node.icon in settingsIcons).toBe(true)
    }
  })
})
