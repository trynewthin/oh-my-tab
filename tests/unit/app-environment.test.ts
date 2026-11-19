import { afterEach, describe, expect, it, vi } from "vitest"
import { appEnvironment } from "@/lib/app-environment"

describe("app environment", () => {
  afterEach(() => vi.unstubAllGlobals())

  it.each([
    ["chrome-extension:", "chromium-extension"],
    ["moz-extension:", "firefox-extension"],
    ["http:", "web"],
    ["https:", "web"],
  ])("resolves the platform for %s", (protocol, platform) => {
    vi.stubGlobal("location", { protocol })
    vi.stubGlobal("chrome", {})
    expect(appEnvironment.platform).toBe(platform)
  })

  it("can be read without a browser location", () => {
    vi.stubGlobal("location", undefined)
    expect(appEnvironment.platform).toBe("web")
  })
})
