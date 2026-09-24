import { useEffect, useRef, useState } from "react"
import {
  ArrowClockwise,
  ArrowUpRight,
  Cloud,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  MapPin,
  Rss,
  Sun,
  Thermometer,
  X,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { loadRemoteWidget } from "@/application/widget-network"
import { Button } from "@/components/ui/button"
import type { RemoteWidgetItem } from "@/lib/grid/utility-types"
import {
  widgetRequestUrl,
  WidgetNetworkError,
  type RemoteWidgetData,
  type WeatherData,
  type WidgetNetworkErrorCode,
} from "@/lib/widgets/network"
import {
  calendarLabel,
  sourceHost,
  weatherCondition,
} from "@/lib/widgets/presentation"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "../collection/layout"
import {
  WidgetAction,
  WidgetEmpty,
  WidgetSurface,
  type WidgetProps,
} from "./surface"

function WeatherGlyph({ code }: { code: number | null }) {
  const condition = weatherCondition(code)
  const Icon = {
    clear: Sun,
    cloudy: CloudSun,
    fog: CloudFog,
    thunder: CloudLightning,
    snow: CloudSnow,
    rain: CloudRain,
    unknown: Thermometer,
  }[condition]
  return (
    <Icon
      size={64}
      weight="light"
      className="utility-weather-glyph"
      aria-hidden="true"
    />
  )
}

function WeatherReading({
  item,
  data,
}: {
  item: Extract<RemoteWidgetItem, { kind: "weather" }>
  data: WeatherData
}) {
  const { t, i18n } = useTranslation()
  return (
    <>
      <div className="utility-weather-reading">
        <div>
          <strong className="utility-temperature">
            {Math.round(data.temperature)}
            <span>°</span>
          </strong>
          <span className="utility-weather-condition">
            {t(`widgets.conditions.${weatherCondition(data.code)}`)}
          </span>
        </div>
        <WeatherGlyph code={data.code} />
      </div>
      {item.size === "large" && (
        <div className="utility-forecast" aria-label={t("widgets.forecast")}>
          {data.forecast.map((day) => (
            <div key={day.date}>
              <time dateTime={day.date}>
                {calendarLabel(day.date, i18n.resolvedLanguage ?? "en", true)}
              </time>
              <span>
                <strong>{Math.round(day.high)}°</strong>
                <span>{Math.round(day.low)}°</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </>
  )
}

export default function RemoteTile(props: WidgetProps<RemoteWidgetItem>) {
  const { item, preview, sample = preview } = props
  const { t } = useTranslation()
  const [data, setData] = useState<RemoteWidgetData | null>(null)
  const [error, setError] = useState<WidgetNetworkErrorCode | null>(null)
  const [loading, setLoading] = useState(false)
  const controller = useRef<AbortController | null>(null)
  useEffect(() => () => controller.current?.abort(), [])
  let source: URL | null = null
  try {
    source = new URL(widgetRequestUrl(item))
  } catch {
    /* Newly added cards need a source. */
  }
  const display: RemoteWidgetData | null = sample
    ? item.kind === "weather"
      ? {
          kind: "weather",
          temperature: item.unit === "fahrenheit" ? 72 : 22,
          code: 0,
          forecast: [
            {
              date: "2026-01-15",
              high: item.unit === "fahrenheit" ? 75 : 24,
              low: item.unit === "fahrenheit" ? 64 : 18,
            },
            {
              date: "2026-01-16",
              high: item.unit === "fahrenheit" ? 73 : 23,
              low: item.unit === "fahrenheit" ? 63 : 17,
            },
            {
              date: "2026-01-17",
              high: item.unit === "fahrenheit" ? 77 : 25,
              low: item.unit === "fahrenheit" ? 66 : 19,
            },
          ],
        }
      : {
          kind: "rss",
          entries: [
            {
              title: t("widgets.feedPreviewOne"),
              url: "https://example.com/journal",
            },
            {
              title: t("widgets.feedPreviewTwo"),
              url: "https://example.com/notes",
            },
            {
              title: t("widgets.design.feedPreviewThree"),
              url: "https://example.com/reading",
            },
          ],
        }
    : data

  async function load() {
    if (preview || !source || loading) return
    controller.current?.abort()
    const request = new AbortController()
    controller.current = request
    setLoading(true)
    setError(null)
    try {
      const next = await loadRemoteWidget(item, request.signal)
      if (!request.signal.aborted) setData(next)
    } catch (cause) {
      if (!request.signal.aborted)
        setError(
          cause instanceof WidgetNetworkError ? cause.code : "requestFailed"
        )
    } finally {
      if (!request.signal.aborted) setLoading(false)
    }
  }
  const attribution =
    item.kind === "weather" ? (
      preview ? (
        <span>Open-Meteo · {item.unit === "celsius" ? "°C" : "°F"}</span>
      ) : (
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="utility-focus"
        >
          Open-Meteo · {item.unit === "celsius" ? "°C" : "°F"}
        </a>
      )
    ) : (
      <span title={source?.origin}>{source?.hostname || "RSS / Atom"}</span>
    )
  const footer = (source || sample) && (
    <>
      {attribution}
      {preview ? (
        <span className="utility-sample-mark">
          {t("widgets.design.example")}
        </span>
      ) : loading ? (
        <WidgetAction
          label={t("widgets.design.cancelLoad")}
          onClick={() => {
            controller.current?.abort()
            setLoading(false)
          }}
        >
          <X size={14} />
        </WidgetAction>
      ) : (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="utility-refresh"
          aria-label={t("widgets.loadFrom", { origin: source?.origin })}
          onClick={() => void load()}
        >
          <ArrowClockwise size={13} />
          {t(data ? "widgets.refresh" : "widgets.load")}
        </Button>
      )}
    </>
  )
  return (
    <WidgetSurface
      {...props}
      className={`utility-remote utility-${item.kind}`}
      title={
        item.kind === "weather" ? item.locationName || item.name : item.name
      }
      footer={footer}
    >
      {!source && !sample ? (
        <WidgetEmpty
          {...props}
          icon={
            item.kind === "weather" ? (
              <MapPin size={30} weight="light" />
            ) : (
              <Rss size={30} weight="light" />
            )
          }
          title={t(
            item.kind === "weather"
              ? "widgets.design.setLocation"
              : "widgets.design.addFeed"
          )}
          hint={t(
            item.kind === "weather"
              ? "widgets.design.weatherHint"
              : "widgets.design.rssHint"
          )}
        />
      ) : (
        <div className="utility-remote-content" aria-busy={loading}>
          {!display && !error && (
            <div className="utility-unloaded">
              <span aria-hidden="true">
                {item.kind === "weather" ? (
                  <Cloud size={36} weight="light" />
                ) : (
                  <Rss size={30} weight="light" />
                )}
              </span>
              <span role={preview ? undefined : "status"}>
                {t(loading ? "widgets.loading" : "widgets.design.readyToLoad")}
              </span>
            </div>
          )}
          {!error && display?.kind === "weather" && item.kind === "weather" && (
            <WeatherReading item={item} data={display} />
          )}
          {!error && display?.kind === "rss" && (
            <CollectionViewport label={item.name}>
              {display.entries.length === 0 ? (
                <p className="utility-empty-hint">{t("widgets.emptyFeed")}</p>
              ) : (
                <CollectionGrid>
                  {display.entries.map((entry, index) => {
                    const content = (
                      <>
                        <span className="utility-feed-index" aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <span className="utility-feed-copy">
                          <strong>{entry.title}</strong>
                          <span>{sourceHost(entry.url)}</span>
                        </span>
                        <ArrowUpRight
                          size={14}
                          className="utility-link-arrow"
                          aria-hidden="true"
                        />
                      </>
                    )
                    return (
                      <CollectionRow
                        key={entry.url}
                        className="utility-feed-row"
                      >
                        {preview ? (
                          <div className="utility-feed-link">{content}</div>
                        ) : (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="utility-feed-link utility-focus"
                            title={entry.title}
                          >
                            {content}
                          </a>
                        )}
                      </CollectionRow>
                    )
                  })}
                </CollectionGrid>
              )}
            </CollectionViewport>
          )}
          {error && (
            <p role="alert" className="utility-error">
              {t(`widgets.errors.${error}`)}
            </p>
          )}
        </div>
      )}
    </WidgetSurface>
  )
}
