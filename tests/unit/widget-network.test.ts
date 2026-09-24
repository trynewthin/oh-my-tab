import { afterEach, describe, expect, test, vi } from "vitest"
import {
  fetchWidgetText,
  WIDGET_RESPONSE_LIMIT,
} from "@/lib/widgets/network"
import type { RemoteWidgetItem } from "@/lib/grid/utility-types"

const requestOrigin = vi.hoisted(() => vi.fn())
vi.mock("@/stores/privacy-store", () => ({
  requestWidgetOrigin: requestOrigin,
}))
import { loadRemoteWidget } from "@/application/widget-network"

const repository: RemoteWidgetItem = {
  id: "repository",
  name: "Repository",
  color: "#123456",
  size: "large",
  kind: "github-repo",
  repository: "trynewthin/oh-my-tab",
}
const responseData = {
  stargazers_count: 12,
  forks_count: 3,
  open_issues_count: 7,
  description: "Example",
  pushed_at: "2026-09-24T00:00:00Z",
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

describe("manual widget requests", () => {
  test("requests permission synchronously and does not fetch after refusal", async () => {
    requestOrigin.mockResolvedValue(false)
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const pending = loadRemoteWidget(repository, new AbortController().signal)
    expect(requestOrigin).toHaveBeenCalledWith("https://api.github.com")
    await expect(pending).rejects.toMatchObject({ code: "permissionDenied" })
    expect(fetch).not.toHaveBeenCalled()
  })

  test("a granted click omits cookies, referrer and redirects", async () => {
    requestOrigin.mockResolvedValue(true)
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(responseData))
    )
    vi.stubGlobal("fetch", fetch)
    await expect(
      loadRemoteWidget(repository, new AbortController().signal)
    ).resolves.toMatchObject({ stars: 12, openItems: 7 })
    expect(fetch).toHaveBeenCalledWith(
      "https://api.github.com/repos/trynewthin/oh-my-tab",
      expect.objectContaining({
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error",
        cache: "no-store",
      })
    )
  })

  test("unconfigured requests never request permission or fetch", async () => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    await expect(
      loadRemoteWidget(
        { ...repository, repository: "" },
        new AbortController().signal
      )
    ).rejects.toMatchObject({ code: "notConfigured" })
    expect(requestOrigin).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  test("aborting while permission is pending prevents the request", async () => {
    let grant!: (value: boolean) => void
    requestOrigin.mockImplementation(() => new Promise<boolean>((resolve) => {
      grant = resolve
    }))
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const controller = new AbortController()
    const pending = loadRemoteWidget(repository, controller.signal)
    controller.abort()
    grant(true)
    await expect(pending).rejects.toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })

  test("reports API rate limits", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response("", { status: 429 })
    ))
    await expect(
      fetchWidgetText("https://example.com", new AbortController().signal)
    ).rejects.toMatchObject({ code: "rateLimited" })
  })

  test("rejects an advertised oversized response", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response("x", {
        headers: { "content-length": String(WIDGET_RESPONSE_LIMIT + 1) },
      })
    ))
    await expect(
      fetchWidgetText("https://example.com", new AbortController().signal)
    ).rejects.toMatchObject({ code: "responseTooLarge" })
  })

  test("counts streamed bytes without trusting Content-Length", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
      new Response("x".repeat(WIDGET_RESPONSE_LIMIT + 1))
    ))
    await expect(
      fetchWidgetText("https://example.com", new AbortController().signal)
    ).rejects.toMatchObject({ code: "responseTooLarge" })
  })
})
