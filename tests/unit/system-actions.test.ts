import { beforeEach, describe, expect, test } from "vitest"

import { runSystemAction } from "@/application/system-actions"
import { useComponentsApplicationStore } from "@/stores/components-application-store"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useSettingsStore } from "@/stores/settings-store"
import { useThemeStore } from "@/stores/theme-store"

describe("system button actions", () => {
  beforeEach(() => {
    useThemeStore.setState({ theme: "light" })
    useGridSelectionStore.setState({ active: false, ids: [] })
    useSettingsStore.setState({ open: false })
    useComponentsApplicationStore.setState({ open: false })
  })

  test("toggles the resolved light and dark modes", () => {
    runSystemAction("toggle-theme")
    expect(useThemeStore.getState().theme).toBe("dark")
    runSystemAction("toggle-theme")
    expect(useThemeStore.getState().theme).toBe("light")
  })

  test("toggles multi-select mode", () => {
    runSystemAction("toggle-selection")
    expect(useGridSelectionStore.getState().active).toBe(true)
    runSystemAction("toggle-selection")
    expect(useGridSelectionStore.getState().active).toBe(false)
  })

  test("opens the settings and components applications", () => {
    runSystemAction("open-settings")
    expect(useSettingsStore.getState().open).toBe(true)
    runSystemAction("open-components")
    expect(useComponentsApplicationStore.getState().open).toBe(true)
  })
})
