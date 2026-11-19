import { createElement } from "react"
import { renderToStaticMarkup } from "react-dom/server"
import { afterEach, expect, test, vi } from "vitest"
import PopupSurface from "@/components/popup/popup-surface"

vi.mock("@/stores/home-settings-store", () => {
  const state = {
    popupAppearance: {
      effect: "none",
      width: 480,
      padding: 28,
      color: "#8844cc",
      animated: false,
    },
    tabTexture: "particles",
    color: "#3478f6",
    burningAmplitude: 1,
    transitionsEnabled: true,
  }
  return {
    useHomeSettingsStore: (select: (current: typeof state) => unknown) =>
      select(state),
  }
})

afterEach(() => vi.unstubAllGlobals())

test("the settings preview and extension Popup use the same configured surface", () => {
  vi.stubGlobal("location", { protocol: "chrome-extension:" })
  vi.stubGlobal("chrome", {
    runtime: {
      getManifest: () => ({ action: { default_popup: "popup.html" } }),
    },
  })
  for (const preview of [true, false]) {
    const markup = renderToStaticMarkup(
      createElement(PopupSurface, { preview })
    )
    expect(markup).toContain("width:480px;padding:28px")
    expect(markup).not.toContain("data-effect-style")
  }
})

test("a standalone web Popup ignores imported extension appearance", () => {
  vi.stubGlobal("location", { protocol: "https:" })
  const markup = renderToStaticMarkup(createElement(PopupSurface))
  expect(markup).toContain("width:360px;padding:20px")
  expect(markup).toContain('data-effect-style="particles"')
})
