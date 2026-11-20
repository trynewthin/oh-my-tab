import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, test, vi } from "vitest"
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

vi.mock("@/components/application/app-sidebar-layout", () => ({
  default: ({
    background,
    children,
  }: {
    background?: ReactNode
    children?: ReactNode
  }) =>
    createElement(
      "div",
      null,
      createElement("div", { "data-shell-background": true }, background),
      children
    ),
}))

vi.mock("@/components/effects/material-surface", () => ({
  default: ({ textureId }: { textureId: string }) =>
    createElement("div", { "data-texture": textureId }),
}))

vi.mock("@/components/settings/settings-views", async () => {
  const { default: MaterialPane } =
    await import("@/components/settings/personalization/material-pane")
  return {
    settingsViews: {
      "search-engines": () => null,
      "personalization-appearance": () => null,
      "personalization-material": MaterialPane,
    },
  }
})

beforeEach(() => {
  useSystemOverlayStore.setState({
    active: null,
    closingApp: null,
    settingsSection: "personalization-material",
  })
})

const props = { onClose: () => {} }

test("renders the preview without applying a default material", () => {
  useSystemOverlayStore.getState().openSettings()
  const html = renderToStaticMarkup(createElement(SettingsApplication, props))

  expect(html).toContain('<div data-shell-background="true"></div>')
  expect(html).toContain("data-material-preview-stage")
  expect(html).not.toContain('data-texture="settings-material-preview-')
})

test("does not mount a material when another settings page is open", () => {
  useSystemOverlayStore.getState().openSettings("personalization-appearance")
  const html = renderToStaticMarkup(createElement(SettingsApplication, props))

  expect(html).not.toContain("data-texture")
})
