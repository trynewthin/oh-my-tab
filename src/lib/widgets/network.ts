import type { RemoteWidgetItem } from "@/lib/grid/utility-types"
import { dateOrdinal, remoteUrl, safeLink } from "./model"

export type WeatherData = {
  kind: "weather"
  temperature: number
  code: number | null
  forecast: { date: string; high: number; low: number }[]
}
export type FeedData = {
  kind: "rss"
  entries: { title: string; url: string }[]
}
export type RemoteWidgetData = WeatherData | FeedData
export type WidgetNetworkErrorCode =
  | "notConfigured"
  | "permissionDenied"
  | "requestFailed"
  | "rateLimited"
  | "responseTooLarge"
  | "invalidResponse"

export class WidgetNetworkError extends Error {
  readonly code: WidgetNetworkErrorCode

  constructor(code: WidgetNetworkErrorCode) {
    super(code)
    this.code = code
    this.name = "WidgetNetworkError"
  }
}

export function widgetRequestUrl(item: RemoteWidgetItem): string {
  switch (item.kind) {
    case "weather": {
      if (
        item.latitude === null ||
        item.longitude === null ||
        !Number.isFinite(item.latitude) ||
        Math.abs(item.latitude) > 90 ||
        !Number.isFinite(item.longitude) ||
        Math.abs(item.longitude) > 180
      )
        throw new WidgetNetworkError("notConfigured")
      const url = new URL("https://api.open-meteo.com/v1/forecast")
      url.search = new URLSearchParams({
        latitude: String(item.latitude),
        longitude: String(item.longitude),
        current: "temperature_2m,weather_code",
        daily: "temperature_2m_max,temperature_2m_min",
        forecast_days: "3",
        temperature_unit: item.unit,
        timezone: "auto",
      }).toString()
      return url.href
    }
    case "rss": {
      const url = remoteUrl(item.feedUrl)
      if (!url) throw new WidgetNetworkError("notConfigured")
      return url
    }
  }
}

export function remoteSourceKey(item: RemoteWidgetItem) {
  try {
    return widgetRequestUrl(item)
  } catch {
    return item.kind
  }
}

export const WIDGET_RESPONSE_LIMIT = 1024 * 1024

export async function fetchWidgetText(url: string, signal: AbortSignal) {
  const response = await fetch(url, {
    signal: AbortSignal.any([signal, AbortSignal.timeout(10_000)]),
    credentials: "omit",
    referrerPolicy: "no-referrer",
    redirect: "error",
    cache: "no-store",
    headers: {
      Accept:
        "application/json, application/atom+xml, application/rss+xml, text/xml",
    },
  })
  if (!response.ok)
    throw new WidgetNetworkError(
      [403, 429].includes(response.status) ? "rateLimited" : "requestFailed"
    )
  if (Number(response.headers.get("content-length")) > WIDGET_RESPONSE_LIMIT) {
    await response.body?.cancel()
    throw new WidgetNetworkError("responseTooLarge")
  }
  const reader = response.body?.getReader()
  if (!reader) throw new WidgetNetworkError("invalidResponse")
  const decoder = new TextDecoder()
  const chunks: string[] = []
  let bytes = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > WIDGET_RESPONSE_LIMIT) {
        await reader.cancel()
        throw new WidgetNetworkError("responseTooLarge")
      }
      chunks.push(decoder.decode(value, { stream: true }))
    }
    chunks.push(decoder.decode())
    return chunks.join("")
  } finally {
    reader.releaseLock()
  }
}

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new WidgetNetworkError("invalidResponse")
  return value as Record<string, unknown>
}

function number(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value))
    throw new WidgetNetworkError("invalidResponse")
  return value
}

function count(value: unknown) {
  const result = number(value)
  if (!Number.isSafeInteger(result) || result < 0)
    throw new WidgetNetworkError("invalidResponse")
  return result
}

export function parseWeather(value: unknown): WeatherData {
  const root = record(value)
  const current = record(root.current)
  const daily = record(root.daily)
  const dates = daily.time
  const highs = daily.temperature_2m_max
  const lows = daily.temperature_2m_min
  if (
    !Array.isArray(dates) ||
    !Array.isArray(highs) ||
    !Array.isArray(lows) ||
    dates.length < 1 ||
    dates.length > 3 ||
    dates.length !== highs.length ||
    dates.length !== lows.length
  )
    throw new WidgetNetworkError("invalidResponse")
  return {
    kind: "weather",
    temperature: number(current.temperature_2m),
    code: current.weather_code == null ? null : count(current.weather_code),
    forecast: dates.map((date: unknown, index: number) => {
      if (typeof date !== "string" || dateOrdinal(date) === null)
        throw new WidgetNetworkError("invalidResponse")
      return {
        date,
        high: number(highs[index]),
        low: number(lows[index]),
      }
    }),
  }
}

function children(element: Element, name: string): Element[] {
  return Array.from(element.childNodes).filter(
    (node): node is Element =>
      node.nodeType === 1 && (node as Element).localName === name
  )
}

/** RSS 2.0, RDF and Atom; remote markup is displayed as text only. */
export function parseFeed(xml: string, source: string): FeedData {
  if (/<!DOCTYPE/i.test(xml)) throw new WidgetNetworkError("invalidResponse")
  const doc = new DOMParser().parseFromString(xml, "text/xml")
  if (!doc.documentElement || doc.getElementsByTagName("parsererror").length)
    throw new WidgetNetworkError("invalidResponse")
  if (!["rss", "RDF", "feed"].includes(doc.documentElement.localName))
    throw new WidgetNetworkError("invalidResponse")
  const entries: FeedData["entries"] = []
  const seen = new Set<string>()
  for (const element of Array.from(doc.getElementsByTagName("*"))) {
    if (!["item", "entry"].includes(element.localName)) continue
    const links = children(element, "link")
    const alternate = links.find(
      (link) =>
        link.hasAttribute("href") &&
        (!link.hasAttribute("rel") || link.getAttribute("rel") === "alternate")
    )
    const raw = alternate?.getAttribute("href") ?? links[0]?.textContent?.trim()
    const url = safeLink(raw, source)
    if (!url || seen.has(url)) continue
    seen.add(url)
    const title = children(element, "title")[0]
      ?.textContent?.trim()
      .slice(0, 160)
    entries.push({ title: title || new URL(url).hostname, url })
    if (entries.length === 5) break
  }
  return { kind: "rss", entries }
}

export async function readRemoteWidget(
  item: RemoteWidgetItem,
  signal: AbortSignal
) {
  const url = widgetRequestUrl(item)
  const body = await fetchWidgetText(url, signal)
  if (item.kind === "rss") return parseFeed(body, url)
  let value: unknown
  try {
    value = JSON.parse(body)
  } catch {
    throw new WidgetNetworkError("invalidResponse")
  }
  return parseWeather(value)
}
