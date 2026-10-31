import { beforeEach, describe, expect, test } from "vitest"

import { runSystemAction } from "@/application/system-actions"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import {
  isSystemActionOnSurface,
  systemActionIdsFor,
  systemActionStatus,
} from "@/lib/system-actions"
import { defaultSettingsSection } from "@/lib/settings-sections"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import { useThemeStore } from "@/stores/theme-store"

describe("system button actions", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" })
    useGridSelectionStore.setState({ active: false, ids: [] })
    useSystemOverlayStore.setState({
      active: null,
      settingsSection: defaultSettingsSection,
    })
  })

  test("toggles the resolved light and dark modes", () => {
    runSystemAction("toggle-theme")
    expect(useThemeStore.getState().theme).toBe("dark")
    runSystemAction("toggle-theme")
    expect(useThemeStore.getState().theme).toBe("light")
  })

  test("sets the requested theme without cycling through modes", () => {
    runSystemAction({ id: "set-theme", theme: "system" })
    expect(useThemeStore.getState().theme).toBe("system")
    runSystemAction({ id: "set-theme", theme: "dark" })
    expect(useThemeStore.getState().theme).toBe("dark")
  })

  test("toggles multi-select mode", () => {
    runSystemAction("toggle-selection")
    expect(useGridSelectionStore.getState().active).toBe(true)
    runSystemAction("toggle-selection")
    expect(useGridSelectionStore.getState().active).toBe(false)
  })

  test("retired global edit controls do not change the current mode", () => {
    runSystemAction("toggle-selection")
    runSystemAction("toggle-edit")
    expect(useGridSelectionStore.getState().active).toBe(true)
    expect(useSystemOverlayStore.getState().active).toBeNull()
  })

  test("opens one global surface at a time and keeps the settings section", () => {
    runSystemAction("open-settings")
    expect(useSystemOverlayStore.getState().active).toBe("settings")
    runSystemAction({ id: "open-settings", section: "search-engines" })
    expect(useSystemOverlayStore.getState().settingsSection).toBe(
      "search-engines"
    )
    runSystemAction("open-components")
    expect(useSystemOverlayStore.getState().active).toBe("components")
    useSystemOverlayStore.getState().close("settings")
    expect(useSystemOverlayStore.getState().active).toBe("components")
    runSystemAction("add-tab")
    expect(useSystemOverlayStore.getState().active).toBe("add-tab")
    runSystemAction("add-folder")
    expect(useSystemOverlayStore.getState().active).toBe("add-tab")
    useSystemOverlayStore.getState().close("add-tab")
    expect(useSystemOverlayStore.getState().active).toBeNull()
    runSystemAction("open-settings")
    expect(useSystemOverlayStore.getState().settingsSection).toBe(
      "search-engines"
    )
  })

  test("shares action availability across menus and saved controls", () => {
    expect(systemActionIdsFor("more-actions")).toEqual([
      "add-tab",
      "open-components",
      "tidy-grid",
      "toggle-selection",
    ])
    expect(isSystemActionOnSurface("add-tab", "quick-bar")).toBe(true)
    expect(isSystemActionOnSurface("add-folder", "grid-button")).toBe(true)
    for (const surface of ["grid-button", "quick-bar", "more-actions"] as const)
      expect(systemActionIdsFor(surface)).not.toContain("add-folder")
    expect(
      systemActionStatus("add-folder", { canTidy: true, selecting: false })
    ).toEqual({ disabled: true })
    expect(isSystemActionOnSurface("toggle-edit", "quick-bar")).toBe(true)
    expect(systemActionIdsFor("quick-bar")).not.toContain("toggle-edit")
    expect(systemActionIdsFor("grid-button")).not.toContain("toggle-edit")
    expect(isSystemActionOnSurface("set-theme", "grid-button")).toBe(false)
    expect(
      systemActionStatus("tidy-grid", {
        canTidy: false,
        selecting: false,
      })
    ).toEqual({ disabled: true })
    expect(
      systemActionStatus("toggle-selection", {
        canTidy: true,
        selecting: true,
      })
    ).toEqual({ disabled: false, pressed: true })
    expect(
      systemActionStatus("toggle-edit", {
        canTidy: true,
        selecting: false,
      })
    ).toEqual({ disabled: true })
  })
})
