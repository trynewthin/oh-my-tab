import { createElement, type ReactNode } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { beforeEach, expect, test, vi } from "vitest"
import SettingsApplication from "@/components/settings/settings-application"
import { useSystemOverlayStore } from "@/stores/system-overlay-store"
import { useThemeStore } from "@/stores/theme-store"

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
    sidebarBackground,
    windowStyle,
    children,
  }: {
    background?: ReactNode
    sidebarBackground?: ReactNode
    windowStyle?: React.CSSProperties
    children?: ReactNode
  }) =>
    createElement(
      "div",
      { style: windowStyle },
      createElement("div", { "data-shell-background": true }, background),
      createElement("aside", null, sidebarBackground),
      children
    ),
}))

vi.mock("@/stores/theme-store", async (importOriginal) => {
  const { useThemeStore } =
    await importOriginal<typeof import("@/stores/theme-store")>()
  return {
    useThemeStore: Object.assign(
      (
        selector: (state: ReturnType<typeof useThemeStore.getState>) => unknown
      ) => selector(useThemeStore.getState()),
      useThemeStore
    ),
  }
})

vi.mock("@/components/effects/material-surface", () => ({
  default: ({
    textureId,
    amplitude,
    animated,
  }: {
    textureId: string
    amplitude?: number
    animated?: boolean
  }) =>
    createElement("div", {
      "data-texture": textureId,
      "data-amplitude": amplitude,
      "data-animated": animated,
    }),
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
  useThemeStore.setState({ settingsAppearance: undefined })
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

test("renders assigned materials on the settings window outside the material page", () => {
  useThemeStore.setState({
    settingsAppearance: {
      backgroundMaterial: "fair-isle",
      sidebarMaterial: "liquid-glass",
      controlMaterial: "particles",
    },
  })
  useSystemOverlayStore.getState().openSettings("personalization-appearance")
  const html = renderToStaticMarkup(createElement(SettingsApplication, props))

  expect(html).toContain(
    'data-settings-material-surface="background" data-material="fair-isle"'
  )
  expect(html).toContain(
    'data-settings-material-surface="sidebar" data-material="liquid-glass"'
  )
  expect(html).toContain("--settings-control-image:url(")
  expect(html).toContain("var(--popover) 60%, transparent")
  expect(html).not.toContain("backdrop-filter:")
})

test("renders a blur-only background mask without tinting the material", () => {
  useThemeStore.setState({
    settingsAppearance: {
      backgroundMaterial: "burning",
      backgroundMask: { strength: 0, blur: 12 },
    },
  })
  const html = renderToStaticMarkup(createElement(SettingsApplication, props))

  expect(html).toContain("data-settings-background-mask")
  expect(html).toContain("var(--popover) 0%, transparent")
  expect(html).toContain("backdrop-filter:blur(12px)")
})

test("applies independent parameters for the same material on different surfaces", () => {
  useThemeStore.setState({
    settingsAppearance: {
      backgroundMaterial: "particles",
      sidebarMaterial: "particles",
      controlMaterial: "particles",
      materialParameters: {
        background: { particles: 1.5 },
        sidebar: { particles: 0 },
        control: { particles: 0 },
      },
    },
  })
  useSystemOverlayStore.getState().openSettings("personalization-appearance")
  const html = renderToStaticMarkup(createElement(SettingsApplication, props))

  expect(html).toContain(
    'data-texture="settings-background" data-amplitude="1.5" data-animated="true"'
  )
  expect(html).toContain(
    'data-texture="settings-sidebar" data-amplitude="0" data-animated="false"'
  )
  expect(html).not.toContain("--settings-control-image")
})
