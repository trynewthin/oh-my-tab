import { afterEach, expect, it } from "vitest"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

afterEach(() =>
  useSystemOverlayStore.setState(useSystemOverlayStore.getInitialState())
)

it("retains a closing app only until its exit animation finishes", () => {
  const overlays = useSystemOverlayStore.getState()
  overlays.openSettings("search-engines")
  overlays.close("settings")
  expect(useSystemOverlayStore.getState()).toMatchObject({
    active: null,
    closingApp: "settings",
    settingsSection: "search-engines",
  })
  overlays.finishClosingApp("settings")
  expect(useSystemOverlayStore.getState().closingApp).toBeNull()
  overlays.openSettings()
  expect(useSystemOverlayStore.getState().settingsSection).toBe(
    "search-engines"
  )
})

it("keeps a newly opened app when another app finishes closing", () => {
  const overlays = useSystemOverlayStore.getState()
  overlays.open("components")
  overlays.close("components")
  overlays.open("notes")
  overlays.finishClosingApp("components")
  expect(useSystemOverlayStore.getState()).toMatchObject({
    active: "notes",
    closingApp: null,
  })
})
