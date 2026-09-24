import { afterEach, describe, expect, test, vi } from "vitest"
import { fetchWidgetText, WIDGET_RESPONSE_LIMIT } from "@/lib/widgets/network"
import type { RemoteWidgetItem } from "@/lib/grid/utility-types"

const requestOrigin = vi.hoisted(() => vi.fn())
vi.mock("@/stores/privacy-store", () => ({
  requestWidgetOrigin: requestOrigin,
}))
import { loadRemoteWidget } from "@/application/widget-network"

const weather: RemoteWidgetItem = {
  id: "weather",
  name: "Weather",
  color: "#123456",
  size: "large",
  kind: "weather",
  latitude: 35.68,
  longitude: 139.69,
  locationName: "Tokyo",
  unit: "celsius",
}
const responseData = {
  current: { temperature_2m: 22, weather_code: 0 },
  daily: {
    time: ["2026-09-24"],
    temperature_2m_max: [25],
    temperature_2m_min: [18],
  },
}

function mockFetch(response: Response) {
  const fetch = vi.fn().mockResolvedValue(response)
  vi.stubGlobal("fetch", fetch)
  return fetch
}

afterEach(() => {
  vi.unstubAllGlobals()
  vi.resetAllMocks()
})

describe("manual widget requests", () => {
  test("requests permission on click; refusal prevents fetch", async () => {
    requestOrigin.mockResolvedValue(false)
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const pending = loadRemoteWidget(weather, new AbortController().signal)
    expect(requestOrigin).toHaveBeenCalledWith("https://api.open-meteo.com")
    await expect(pending).rejects.toMatchObject({ code: "permissionDenied" })
    expect(fetch).not.toHaveBeenCalled()
  })

  test("granted requests omit cookies, referrer and redirects", async () => {
    requestOrigin.mockResolvedValue(true)
    const fetch = mockFetch(new Response(JSON.stringify(responseData)))
    const pending = loadRemoteWidget(weather, new AbortController().signal)
    await expect(pending).resolves.toMatchObject({
      kind: "weather",
      temperature: 22,
    })
    expect(fetch).toHaveBeenCalledWith(
      "https://api.open-meteo.com/v1/forecast?latitude=35.68&longitude=139.69" +
        "&current=temperature_2m%2Cweather_code" +
        "&daily=temperature_2m_max%2Ctemperature_2m_min" +
        "&forecast_days=3&temperature_unit=celsius&timezone=auto",
      expect.objectContaining({
        credentials: "omit",
        referrerPolicy: "no-referrer",
        redirect: "error",
        cache: "no-store",
      })
    )
  })

  test("unconfigured widgets neither request permission nor fetch", async () => {
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const empty = { ...weather, latitude: null, longitude: null }
    const pending = loadRemoteWidget(empty, new AbortController().signal)
    await expect(pending).rejects.toMatchObject({ code: "notConfigured" })
    expect(requestOrigin).not.toHaveBeenCalled()
    expect(fetch).not.toHaveBeenCalled()
  })

  test("aborting while permission is pending prevents fetch", async () => {
    let grant!: (value: boolean) => void
    requestOrigin.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          grant = resolve
        })
    )
    const fetch = vi.fn()
    vi.stubGlobal("fetch", fetch)
    const controller = new AbortController()
    const pending = loadRemoteWidget(weather, controller.signal)
    controller.abort()
    grant(true)
    await expect(pending).rejects.toBeTruthy()
    expect(fetch).not.toHaveBeenCalled()
  })

  test("reports API rate limits", async () => {
    mockFetch(new Response("", { status: 429 }))
    const signal = new AbortController().signal
    const pending = fetchWidgetText("https://example.com", signal)
    await expect(pending).rejects.toMatchObject({ code: "rateLimited" })
  })

  test("rejects an advertised oversized response", async () => {
    const headers = { "content-length": String(WIDGET_RESPONSE_LIMIT + 1) }
    mockFetch(new Response("x", { headers }))
    const signal = new AbortController().signal
    const pending = fetchWidgetText("https://example.com", signal)
    await expect(pending).rejects.toMatchObject({ code: "responseTooLarge" })
  })

  test("bounds streamed bytes without trusting Content-Length", async () => {
    mockFetch(new Response("x".repeat(WIDGET_RESPONSE_LIMIT + 1)))
    const signal = new AbortController().signal
    const pending = fetchWidgetText("https://example.com", signal)
    await expect(pending).rejects.toMatchObject({ code: "responseTooLarge" })
  })
})
