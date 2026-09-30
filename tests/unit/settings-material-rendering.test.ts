import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, describe, expect, test, vi } from "vitest"
import SettingsApplication from "@/components/settings/settings-application"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"

vi.mock("react-i18next", async (importOriginal) => ({
  ...(await importOriginal<typeof import("react-i18next")>()),
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock("@/stores/system-overlay-store", async (importOriginal) => {
  const { useSystemOverlayStore } =
    await importOriginal<typeof import("@/stores/system-overlay-store")>()
  // Render current state instead of Zustand's initial SSR hydration snapshot.
  return {
    useSystemOverlayStore: Object.assign(
      (
        selector: (
          state: ReturnType<typeof useSystemOverlayStore.getState>
        ) => unknown
      ) => selector(useSystemOverlayStore.getState()),
      useSystemOverlayStore
    ),
  }
})

vi.mock("@/components/application/application-dialog", () => ({
  default: ({
    backgroundEffect,
    children,
  }: {
    backgroundEffect?: ReactNode
    children?: ReactNode
  }) => createElement("div", null, backgroundEffect, children),
}))

vi.mock("@/components/effects/effect-surface", () => ({
  default: ({ visible, entrance }: { visible: boolean; entrance?: boolean }) =>
    createElement("div", {
      "data-visible": String(visible),
      "data-entrance": String(entrance),
    }),
}))

vi.mock("@/components/settings/settings-views", () => ({
  settingsViews: {
    "search-engines": () => null,
    "personalization-appearance": () => null,
    "personalization-material": () => null,
  },
}))

beforeEach(() => {
  useSystemOverlayStore.setState({
    active: null,
    settingsSection: "personalization-material",
  })
})

describe("material initial render state", () => {
  test("shows material immediately without overriding the dialog background", () => {
    useSystemOverlayStore.getState().openSettings()
    const html = renderToStaticMarkup(createElement(SettingsApplication))

    expect(html).toContain('style="opacity:1"')
    expect(html).toContain('data-visible="true"')
    expect(html).toContain('data-entrance="true"')
    expect(html).not.toContain("background-color:")
    expect(html).not.toContain("--foreground:")
  })

  test("keeps material mounted throughout the dialog exit animation", () => {
    useSystemOverlayStore.getState().openSettings()
    useSystemOverlayStore.getState().close("settings")
    const closed = renderToStaticMarkup(createElement(SettingsApplication))
    expect(closed).toContain('style="opacity:1"')
    expect(closed).toContain('data-visible="true"')
    expect(closed).not.toContain("background-color:")

    useSystemOverlayStore.getState().openSettings()
    const reopened = renderToStaticMarkup(createElement(SettingsApplication))
    expect(reopened).toContain('style="opacity:1"')
    expect(reopened).toContain('data-visible="true"')
  })

  test("hides material and restores the palette on other settings pages", () => {
    useSystemOverlayStore.getState().openSettings("personalization-appearance")
    const html = renderToStaticMarkup(createElement(SettingsApplication))
    expect(html).toContain('style="opacity:0"')
    expect(html).toContain('data-visible="false"')
    expect(html).not.toContain("background-color:")
    expect(html).not.toContain("--foreground:")
  })
})
