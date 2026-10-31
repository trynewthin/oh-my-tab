import { beforeEach, describe, expect, test } from "vitest"

import { runSystemAction } from "@/application/system-actions"
import { useGridEditStore } from "@/stores/grid-edit-store"
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
    useGridEditStore.setState({ active: false })
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

  test("toggles edit mode", () => {
    runSystemAction("toggle-edit")
    expect(useGridEditStore.getState().active).toBe(true)
    runSystemAction("toggle-edit")
    expect(useGridEditStore.getState().active).toBe(false)
  })

  test("keeps edit and multi-select modes exclusive", () => {
    runSystemAction("toggle-selection")
    runSystemAction("toggle-edit")
    expect(useGridEditStore.getState().active).toBe(true)
    expect(useGridSelectionStore.getState().active).toBe(false)
    runSystemAction("toggle-selection")
    expect(useGridSelectionStore.getState().active).toBe(true)
    expect(useGridEditStore.getState().active).toBe(false)
  })

  test("leaves edit mode when opening add, component or settings surfaces", () => {
    for (const action of [
      "add-tab",
      "add-folder",
      "open-components",
      "open-settings",
    ] as const) {
      runSystemAction("toggle-edit")
      expect(useGridEditStore.getState().active).toBe(true)
      runSystemAction(action)
      expect(useGridEditStore.getState().active).toBe(false)
    }
    runSystemAction("toggle-edit")
    runSystemAction({ id: "open-settings", section: "search-engines" })
    expect(useGridEditStore.getState().active).toBe(false)
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
    expect(useSystemOverlayStore.getState().active).toBe("add-folder")
    useSystemOverlayStore.getState().close("add-folder")
    expect(useSystemOverlayStore.getState().active).toBeNull()
    runSystemAction("open-settings")
    expect(useSystemOverlayStore.getState().settingsSection).toBe(
      "search-engines"
    )
  })

  test("shares action availability across menus and saved controls", () => {
    expect(systemActionIdsFor("more-actions")).toEqual([
      "add-tab",
      "add-folder",
      "open-components",
      "tidy-grid",
      "toggle-selection",
      "toggle-edit",
    ])
    expect(isSystemActionOnSurface("add-tab", "quick-bar")).toBe(true)
    expect(isSystemActionOnSurface("add-folder", "grid-button")).toBe(true)
    expect(isSystemActionOnSurface("toggle-edit", "quick-bar")).toBe(true)
    expect(isSystemActionOnSurface("set-theme", "grid-button")).toBe(false)
    expect(
      systemActionStatus("tidy-grid", {
        canTidy: false,
        selecting: false,
        editing: false,
      })
    ).toEqual({ disabled: true })
    expect(
      systemActionStatus("toggle-selection", {
        canTidy: true,
        selecting: true,
        editing: false,
      })
    ).toEqual({ disabled: false, pressed: true })
    expect(
      systemActionStatus("toggle-edit", {
        canTidy: true,
        selecting: false,
        editing: true,
      })
    ).toEqual({ disabled: false, pressed: true })
  })
})
