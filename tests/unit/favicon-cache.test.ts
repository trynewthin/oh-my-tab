import { describe, expect, it, vi, beforeEach } from "vitest"

const state = vi.hoisted(() => ({
  consent: false,
  records: new Map<string, unknown>(),
}))

vi.mock("@/lib/storage", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/storage")>()
  return {
    ...actual,
    readEntries: async (keys: string[]) =>
      Object.fromEntries(keys.map((key) => [key, state.records.get(key)])),
    writeEntries: async (entries: Record<string, unknown>) =>
      Object.entries(entries).forEach(([key, value]) =>
        state.records.set(key, value)
      ),
    chromeStorage: () => undefined,
    subscribeStorage: () => () => {},
  }
})

vi.mock("@/stores/privacy-store", () => ({
  networkAllowed: async () => state.consent,
}))

// Named classes: an inline class expression inside vi.stubGlobal's argument
// list trips a parser bug in Vite's oxc transformer.
class FakeImage {
  naturalWidth = 32
  naturalHeight = 32
  onload?: () => void
  set src(value: string) {
    if (value) queueMicrotask(() => this.onload?.())
  }
}
class FakeDOMParser {
  parseFromString(html: string) {
    return {
      querySelector: () => null,
      querySelectorAll: () =>
        html.startsWith("declared")
          ? [{ rel: "icon", getAttribute: () => "/custom-favicon.svg" }]
          : [],
    }
  }
}

// Decoding is a browser responsibility; this test exercises storage and
// requests, so image parsing is stubbed while fetch behavior stays real.
function stubBrowserApis() {
  vi.stubGlobal("Image", FakeImage)
  vi.stubGlobal("DOMParser", FakeDOMParser)
}

const freshCache = () => import("@/lib/favicon-cache")

describe("favicon-cache", () => {
  beforeEach(() => {
    state.consent = false
    state.records.clear()
    vi.resetModules()
    vi.unstubAllGlobals()
    stubBrowserApis()
    vi.stubGlobal("window", {
      location: { protocol: "chrome-extension:" },
    })
  })

  it("persists downloads across page instances and coalesces requests", async () => {
    const requests: { url: string; options: RequestInit }[] = []
    vi.stubGlobal("fetch", async (url: string, options: RequestInit) => {
      if (!url.includes("favicon") && !url.includes("icons.duckduckgo.com")) {
        return new Response(
          url.includes("declared.example")
            ? "declared" + " ".repeat(3 * 1024 * 1024)
            : ""
        )
      }
      requests.push({ url, options })
      return url.includes("missing.example") ||
        (url.includes("fallback.example") &&
          !url.includes("icons.duckduckgo.com")) ||
        (url.includes("second.example") && !url.includes("a.favicon.im"))
        ? new Response(null, { status: 404 })
        : new Response(new Uint8Array([1, 2, 3]), {
            headers: { "content-type": "image/x-icon" },
          })
    })

    const blocked = await freshCache()
    expect(await blocked.getCachedFavicon("https://blocked.example")).toBeNull()
    expect(requests).toHaveLength(0)
    state.consent = true

    const first = await freshCache()
    expect(first.faviconKey("https://example.com/path?q=1")).toBe(
      "https://example.com/favicon.ico"
    )
    expect(await first.getCachedFavicon("javascript:alert(1)")).toBeNull()
    expect(requests).toHaveLength(0)

    const [a, b] = await Promise.all([
      first.getCachedFavicon("https://example.com/one"),
      first.getCachedFavicon("https://example.com/two"),
    ])
    expect(a).toMatch(/^blob:/)
    expect(a).toBe(b)
    expect(requests).toHaveLength(1)
    expect(requests[0].options.credentials).toBe("omit")

    const nextPage = await freshCache()
    expect(
      await nextPage.getCachedFavicon("https://example.com/another")
    ).toMatch(/^blob:/)
    expect(
      requests,
      "page reload reads stored cache without downloading"
    ).toHaveLength(1)

    const anotherPage = await freshCache()
    await Promise.all([
      nextPage.getCachedFavicon("https://concurrent.example/a"),
      anotherPage.getCachedFavicon("https://concurrent.example/b"),
    ])
    expect(requests, "cross-page lock avoids duplicate download").toHaveLength(
      2
    )

    expect(await first.getCachedFavicon("https://missing.example")).toBeNull()
    const afterFailure = await freshCache()
    expect(
      await afterFailure.getCachedFavicon("https://missing.example")
    ).toBeNull()
    expect(
      requests,
      "both services fail once, then cooldown persists"
    ).toHaveLength(4)

    const start = requests.length
    expect(await first.getCachedFavicon("https://fallback.example")).toMatch(
      /^blob:/
    )
    expect(requests.slice(start).map((r) => new URL(r.url).hostname)).toEqual([
      "a.favicon.im",
      "icons.duckduckgo.com",
    ])
    const reloaded = await freshCache()
    expect(await reloaded.getCachedFavicon("https://fallback.example")).toMatch(
      /^blob:/
    )
    expect(requests, "fallback success is persisted").toHaveLength(start + 2)

    expect(await first.getCachedFavicon("https://second.example")).toMatch(
      /^blob:/
    )
    expect(requests, "stop after first service succeeds").toHaveLength(
      start + 3
    )
    expect(requests.at(-1)!.url).toContain("throw-error-on-404=true")

    expect(
      await first.getCachedFavicon("https://declared.example/app")
    ).toMatch(/^blob:/)
    expect(requests.at(-1)!.url).toBe(
      "https://a.favicon.im/declared.example?larger=true&throw-error-on-404=true"
    )
    const beforeRefresh = requests.length
    await first.getCachedFavicon("https://declared.example/app", true)
    expect(requests).toHaveLength(beforeRefresh + 1)
    expect(requests.at(-1)!.options.cache).toBe("reload")
    const afterRefresh = await freshCache()
    await afterRefresh.getCachedFavicon("https://declared.example/app")
    expect(requests).toHaveLength(beforeRefresh + 1)

    vi.stubGlobal("chrome", {
      tabs: {
        query: async () => [
          {
            url: "https://live.example/app#one",
            favIconUrl: "https://live.example/runtime-favicon.png",
          },
        ],
      },
    })
    await first.getCachedFavicon("https://live.example/app#two")
    expect(requests.at(-1)!.url).toBe(
      "https://a.favicon.im/live.example?larger=true&throw-error-on-404=true"
    )
    vi.unstubAllGlobals()
  })
})
