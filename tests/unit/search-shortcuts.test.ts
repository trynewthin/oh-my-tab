import { describe, expect, test } from "vitest"

import { snapshot, validateConfig } from "@/application/config-transfer"
import {
  appendSearchShortcut,
  defaultSearchShortcuts,
  moveSearchShortcut,
  removeSearchShortcut,
  sanitizeSearchShortcuts,
  searchShortcutGroups,
  setSearchShortcutBoundary,
  validSearchShortcuts,
} from "@/lib/search-shortcuts"

describe("search quick buttons", () => {
  test("defaults to the existing More actions menu and a visible Settings button", () => {
    const config = defaultSearchShortcuts()
    expect(config.controls.map((control) => control.action)).toEqual([
      "toggle-theme",
      "add-tab",
      "add-folder",
      "open-components",
      "tidy-grid",
      "toggle-selection",
      "open-settings",
    ])
    expect(config.collapseBefore).toBe(6)
    expect(searchShortcutGroups(config).hidden).toHaveLength(6)
    expect(
      searchShortcutGroups(config).visible.map((control) => control.action)
    ).toEqual(["open-settings"])
    expect(validSearchShortcuts(config)).toBe(true)
  })

  test("adds visible copies, reorders buttons and preserves the boundary on removal", () => {
    const initial = defaultSearchShortcuts()
    const added = appendSearchShortcut(initial, {
      id: "extra-settings",
      action: "open-settings",
    })
    expect(added.controls).toHaveLength(8)
    expect(added.collapseBefore).toBe(6)
    const moved = moveSearchShortcut(added, "extra-settings", 0)
    expect(moved.controls[0].id).toBe("extra-settings")
    const uncovered = setSearchShortcutBoundary(moved, 2)
    expect(uncovered.collapseBefore).toBe(2)
    const removed = removeSearchShortcut(uncovered, "extra-settings")
    expect(removed.collapseBefore).toBe(1)
    expect(removed.controls).toHaveLength(7)
  })

  test("rejects bad saved actions and keeps valid buttons during recovery", () => {
    const bad = {
      controls: [
        { id: "one", action: "open-settings" },
        { id: "invalid", action: "erase-data" },
        { id: "two", action: "toggle-theme" },
      ],
      collapseBefore: 2,
    }
    expect(validSearchShortcuts(bad)).toBe(false)
    expect(sanitizeSearchShortcuts(bad)).toEqual({
      controls: [bad.controls[0], bad.controls[2]],
      collapseBefore: 1,
    })
  })

  test("exports the configuration and supplies defaults to older backups", () => {
    const current = JSON.parse(JSON.stringify(snapshot()))
    current.home.searchShortcuts = appendSearchShortcut(
      defaultSearchShortcuts(),
      { id: "extra", action: "toggle-theme" }
    )
    expect(validateConfig(current).home.searchShortcuts).toEqual(
      current.home.searchShortcuts
    )

    const legacy = JSON.parse(JSON.stringify(snapshot()))
    delete legacy.home.searchShortcuts
    expect(validateConfig(legacy).home.searchShortcuts).toEqual(
      defaultSearchShortcuts()
    )

    current.home.searchShortcuts.controls[0].action = "erase-data"
    expect(() => validateConfig(current)).toThrow()
  })
})
