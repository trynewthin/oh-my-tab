import { useEffect, useRef, useState, type ReactNode } from "react"
import {
  ArrowCounterClockwise,
  GearSix,
  Pause,
  Play,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { loadRemoteWidget } from "@/application/widget-network"
import { useWallClock } from "@/components/effects/use-wall-clock"
import {
  CollectionCardHeader,
  CollectionHeaderAction,
} from "./collection/header"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "./collection/layout"
import ComponentBackground from "./shared/component-background"
import type {
  RemoteWidgetItem,
  UtilityWidgetItem,
} from "@/lib/grid/utility-types"
import {
  completePomodoro,
  daysUntil,
  formatDuration,
  localDateKey,
  NOTE_MAX_LENGTH,
  remainingTime,
  safeLink,
  togglePomodoro,
  resetPomodoro,
} from "@/lib/widgets/model"
import {
  remoteSourceKey,
  widgetRequestUrl,
  WidgetNetworkError,
  type RemoteWidgetData,
  type WidgetNetworkErrorCode,
} from "@/lib/widgets/network"
import { useTabGridStore } from "@/stores/tab-grid-store"
import { updateUtilityWidget } from "@/stores/widget-actions"

type Props<T extends UtilityWidgetItem = UtilityWidgetItem> = {
  item: T
  preview?: boolean
  onOpen: () => void
}

function Frame({
  item,
  preview = false,
  onOpen,
  children,
  header = true,
}: Props & { children: ReactNode; header?: boolean }) {
  const { t } = useTranslation()
  return (
    <section
      aria-label={item.name}
      data-utility-widget={item.kind}
      className="relative flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[inherit]"
      onMouseDown={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest("button, input, textarea, select, a")
        )
          event.stopPropagation()
      }}
    >
      <ComponentBackground
        color={item.color}
        animated={!!item.dynamicEffect}
      />
      <div className="relative z-10 flex h-full min-h-0 flex-col gap-2 p-3">
        {header && (
          <CollectionCardHeader>
            <span className="min-w-0 truncate text-xs font-medium">
              {item.name}
            </span>
            {!preview && (
              <CollectionHeaderAction
                label={t("widgets.configure")}
                onClick={onOpen}
              >
                <GearSix size={14} />
              </CollectionHeaderAction>
            )}
          </CollectionCardHeader>
        )}
        {children}
      </div>
    </section>
  )
}

function Empty({
  preview,
  onOpen,
  message,
}: {
  preview?: boolean
  onOpen: () => void
  message?: string
}) {
  const { t } = useTranslation()
  if (preview)
    return (
      <p className="m-auto text-center text-xs text-muted-foreground">
        {message ?? t("widgets.configure")}
      </p>
    )
  return (
    <button
      type="button"
      className="m-auto rounded-lg p-2 text-center text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      onClick={onOpen}
    >
      {message ?? t("widgets.configure")}
    </button>
  )
}

function ClockTile(props: Props<Extract<UtilityWidgetItem, { kind: "clock" }>>) {
  const { item, preview, onOpen } = props
  const { i18n } = useTranslation()
  const now = useWallClock(preview)
  const zone = item.timeZone ? { timeZone: item.timeZone } : {}
  const locale = i18n.resolvedLanguage ?? "en"
  const time = new Intl.DateTimeFormat(locale, {
    ...zone,
    hour: "2-digit",
    minute: "2-digit",
    second: item.showSeconds ? "2-digit" : undefined,
    hourCycle: item.hour12 ? "h12" : "h23",
  }).format(now)
  const date = new Intl.DateTimeFormat(locale, {
    ...zone,
    month: "short",
    day: "numeric",
    weekday: "short",
  }).format(now)
  const content = (
    <>
      <time
        dateTime={new Date(now).toISOString()}
        className={
          item.size === "small"
            ? "text-xl font-medium tracking-tight tabular-nums"
            : item.size === "medium"
              ? "text-3xl font-medium tracking-tight tabular-nums"
              : "text-4xl font-medium tracking-tight tabular-nums"
        }
      >
        {time}
      </time>
      {item.size !== "small" && (
        <span className="text-xs text-muted-foreground">{date}</span>
      )}
      {item.size === "large" && item.timeZone && (
        <span className="max-w-full truncate text-xs text-muted-foreground">
          {item.timeZone}
        </span>
      )}
    </>
  )
  return (
    <Frame {...props} header={false}>
      {preview ? (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2">
          {content}
        </div>
      ) : (
        <button
          type="button"
          onClick={onOpen}
          className="flex min-h-0 flex-1 flex-col items-center justify-center gap-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {content}
        </button>
      )}
    </Frame>
  )
}

function CountdownTile(
  props: Props<Extract<UtilityWidgetItem, { kind: "countdown" }>>
) {
  const { item, preview } = props
  const { t } = useTranslation()
  const now = useWallClock(preview)
  const events = preview
    ? [{ id: "preview", title: t("widgets.event"), date: "2026-01-22" }]
    : item.events
  const visible = item.size === "medium" ? events.slice(0, 1) : events
  return (
    <Frame {...props}>
      {visible.length === 0 ? (
        <Empty {...props} />
      ) : (
        <CollectionViewport label={item.name}>
          <CollectionGrid className="space-y-2">
            {visible.map((event) => {
              const days = daysUntil(event.date, now)
              return (
                <CollectionRow
                  key={event.id}
                  className={item.size === "medium" ? "h-auto min-h-8" : undefined}
                >
                  <div className="flex h-full items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="truncate text-xs">{event.title}</div>
                      <time
                        className="text-[10px] text-muted-foreground"
                        dateTime={event.date}
                      >
                        {event.date}
                      </time>
                    </div>
                    <span className="shrink-0 text-lg font-medium tabular-nums">
                      {days === null
                        ? "—"
                        : days === 0
                          ? t("widgets.today")
                          : t(
                              days > 0
                                ? "widgets.daysLeft"
                                : "widgets.daysAgo",
                              { count: Math.abs(days) }
                            )}
                    </span>
                  </div>
                </CollectionRow>
              )
            })}
          </CollectionGrid>
        </CollectionViewport>
      )}
    </Frame>
  )
}

function NoteTile(props: Props<Extract<UtilityWidgetItem, { kind: "note" }>>) {
  const { item, preview } = props
  const { t } = useTranslation()
  return (
    <Frame {...props}>
      {preview ? (
        <p className="min-h-0 flex-1 whitespace-pre-wrap text-sm leading-relaxed">
          {t("widgets.notePreview")}
        </p>
      ) : (
        <textarea
          aria-label={item.name}
          value={item.text}
          maxLength={NOTE_MAX_LENGTH}
          placeholder={t("widgets.notePlaceholder")}
          className="min-h-0 w-full flex-1 resize-none rounded-lg bg-transparent p-1 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          onKeyDown={(event) => event.stopPropagation()}
          onChange={(event) => {
            const text = event.target.value
            updateUtilityWidget(item.id, (current) =>
              current.kind === "note" ? { ...current, text } : current
            )
          }}
        />
      )}
      {!preview && (
        <span className="text-right text-[10px] text-muted-foreground">
          {item.text.length}/{NOTE_MAX_LENGTH}
        </span>
      )}
    </Frame>
  )
}

function PomodoroTile(
  props: Props<Extract<UtilityWidgetItem, { kind: "pomodoro" }>>
) {
  const { item, preview } = props
  const { t } = useTranslation()
  const now = useWallClock(preview)
  const left = remainingTime(item, now)
  useEffect(() => {
    if (preview || item.endsAt === null || item.endsAt > now) return
    updateUtilityWidget(item.id, (current) =>
      current.kind === "pomodoro"
        ? completePomodoro(current, now)
        : current
    )
  }, [item.id, item.endsAt, now, preview])
  const todayCount =
    item.completedOn === localDateKey(now) ? item.completedToday : 0

  return (
    <Frame {...props}>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3">
        <output className="text-4xl font-medium tracking-tight tabular-nums">
          {formatDuration(preview ? 25 * 60_000 : left)}
        </output>
        <span
          role={preview ? undefined : "status"}
          className="text-xs text-muted-foreground"
        >
          {left === 0 && !preview
            ? t("widgets.completed")
            : t("widgets.sessionsToday", { count: todayCount })}
        </span>
        {preview ? (
          <span className="rounded-full bg-foreground p-2 text-background">
            <Play size={16} />
          </span>
        ) : (
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-full bg-foreground p-3 text-background outline-none focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t(
                item.endsAt === null ? "widgets.start" : "widgets.pause"
              )}
              onClick={() =>
                updateUtilityWidget(item.id, (current) =>
                  current.kind === "pomodoro"
                    ? togglePomodoro(current)
                    : current
                )
              }
            >
              {item.endsAt === null ? <Play size={18} /> : <Pause size={18} />}
            </button>
            <button
              type="button"
              className="rounded-full p-2 text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
              aria-label={t("widgets.reset")}
              onClick={() =>
                updateUtilityWidget(item.id, (current) =>
                  current.kind === "pomodoro"
                    ? resetPomodoro(current)
                    : current
                )
              }
            >
              <ArrowCounterClockwise size={18} />
            </button>
          </div>
        )}
      </div>
    </Frame>
  )
}

function PhotoTile(props: Props<Extract<UtilityWidgetItem, { kind: "photo" }>>) {
  const { item, preview, onOpen } = props
  const { t } = useTranslation()
  if (!item.image)
    return (
      <Frame {...props}>
        <Empty
          {...props}
          message={preview ? t("widgets.photoPreview") : undefined}
        />
      </Frame>
    )

  return (
    <figure
      className="relative h-full w-full overflow-hidden rounded-[inherit]"
      data-utility-widget="photo"
    >
      {!preview && (
        <button
          type="button"
          aria-label={t("widgets.configure")}
          onClick={onOpen}
          onMouseDown={(event) => event.stopPropagation()}
          className="absolute top-2 right-2 z-10 rounded-full bg-black/60 p-2 text-white outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <GearSix size={14} />
        </button>
      )}
      <img
        src={item.image}
        alt={item.caption || item.name}
        decoding="async"
        loading="lazy"
        draggable={false}
        className={
          item.fit === "cover"
            ? "h-full w-full object-cover"
            : "h-full w-full object-contain"
        }
      />
      {item.caption && (
        <figcaption className="absolute right-0 bottom-0 left-0 bg-black/60 p-3 text-xs text-white">
          {item.caption}
        </figcaption>
      )}
    </figure>
  )
}

function BookmarkListTile(
  props: Props<Extract<UtilityWidgetItem, { kind: "bookmark-list" }>>
) {
  const { item, preview } = props
  const { t } = useTranslation()
  const source = useTabGridStore((state) =>
    preview
      ? undefined
      : state.items.find((entry) => entry.id === item.folderId)
  )
  const tabs = preview
    ? [
        { id: "1", name: "GitHub", url: "https://github.com" },
        { id: "2", name: "MDN", url: "https://developer.mozilla.org" },
        { id: "3", name: "Wikipedia", url: "https://wikipedia.org" },
      ]
    : source?.kind === "folder"
      ? source.tabs
      : []

  return (
    <Frame {...props}>
      {tabs.length === 0 ? (
        <Empty
          {...props}
          message={t(
            item.folderId ? "widgets.folderEmpty" : "widgets.chooseFolder"
          )}
        />
      ) : (
        <CollectionViewport label={item.name}>
          <CollectionGrid className="space-y-2">
            {tabs.map((tab) => {
              const url = safeLink(tab.url)
              if (!url) return null
              const content = (
                <>
                  <span className="block truncate text-xs font-medium">
                    {tab.name}
                  </span>
                  <span className="block truncate text-[10px] text-muted-foreground">
                    {new URL(url).hostname}
                  </span>
                </>
              )
              return (
                <CollectionRow key={tab.id}>
                  {preview ? (
                    <div className="px-2 py-1">{content}</div>
                  ) : (
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block h-full rounded-lg px-2 py-1 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {content}
                    </a>
                  )}
                </CollectionRow>
              )
            })}
          </CollectionGrid>
        </CollectionViewport>
      )}
    </Frame>
  )
}

function WorldClockTile(
  props: Props<Extract<UtilityWidgetItem, { kind: "world-clock" }>>
) {
  const { item, preview } = props
  const { i18n } = useTranslation()
  const now = useWallClock(preview)
  return (
    <Frame {...props}>
      <CollectionViewport label={item.name}>
        <CollectionGrid className="space-y-2">
          {item.zones.map((zone) => (
            <CollectionRow key={zone.id}>
              <div className="flex h-full items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-xs">{zone.label}</div>
                  <div className="text-[10px] text-muted-foreground">
                    {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                      timeZone: zone.timeZone,
                      weekday: "short",
                    }).format(now)}
                  </div>
                </div>
                <time
                  dateTime={new Date(now).toISOString()}
                  className="shrink-0 text-lg font-medium tabular-nums"
                >
                  {new Intl.DateTimeFormat(i18n.resolvedLanguage, {
                    timeZone: zone.timeZone,
                    hour: "2-digit",
                    minute: "2-digit",
                    hourCycle: item.hour12 ? "h12" : "h23",
                  }).format(now)}
                </time>
              </div>
            </CollectionRow>
          ))}
        </CollectionGrid>
      </CollectionViewport>
    </Frame>
  )
}

function conditionKey(code: number | null) {
  if (code === 0) return "clear"
  if (code !== null && code <= 3) return "cloudy"
  if (code === 45 || code === 48) return "fog"
  if (code !== null && code >= 95) return "thunder"
  if (
    code !== null &&
    ((code >= 71 && code <= 77) || code === 85 || code === 86)
  )
    return "snow"
  if (code !== null && code >= 51 && code <= 82) return "rain"
  return "unknown"
}

function RemoteTile(props: Props<RemoteWidgetItem>) {
  const { item, preview } = props
  const { t, i18n } = useTranslation()
  const [data, setData] = useState<RemoteWidgetData | null>(null)
  const [error, setError] = useState<WidgetNetworkErrorCode | null>(null)
  const [loading, setLoading] = useState(false)
  const controller = useRef<AbortController | null>(null)

  useEffect(() => () => controller.current?.abort(), [])

  let source: URL | null = null
  try {
    source = new URL(widgetRequestUrl(item))
  } catch {
    // An unconfigured card is expected before the user opens its editor.
  }

  const compact = item.size === "medium"
  const display: RemoteWidgetData | null = preview
    ? item.kind === "weather"
      ? {
          kind: "weather",
          temperature: 22,
          code: 1,
          forecast: [
            { date: "2026-01-15", high: 24, low: 18 },
            { date: "2026-01-16", high: 23, low: 17 },
            { date: "2026-01-17", high: 25, low: 19 },
          ],
        }
      : item.kind === "github-repo"
        ? {
            kind: "github-repo",
            stars: 128,
            forks: 12,
            openItems: 4,
            description: t("widgets.githubPreview"),
            pushedAt: null,
          }
        : {
            kind: "rss",
            entries: [
              {
                title: t("widgets.feedPreviewOne"),
                url: "https://example.com/1",
              },
              {
                title: t("widgets.feedPreviewTwo"),
                url: "https://example.com/2",
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

  return (
    <Frame {...props} header={!compact}>
      {!source && !preview ? (
        <Empty {...props} />
      ) : (
        <>
          <div
            className="flex min-h-0 flex-1 flex-col"
            aria-busy={loading}
          >
            {!display && !error && (
              <p className="m-auto text-xs text-muted-foreground">
                {t("widgets.notLoaded")}
              </p>
            )}
            {display?.kind === "weather" && item.kind === "weather" && (
              <>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-xs">
                      {item.locationName || t("widgets.selectedLocation")}
                    </p>
                    {!compact && (
                      <p className="text-xs text-muted-foreground">
                        {t(
                          `widgets.conditions.${conditionKey(display.code)}`
                        )}
                      </p>
                    )}
                  </div>
                  <strong
                    className={
                      compact
                        ? "text-xl font-medium tabular-nums"
                        : "text-3xl font-medium tabular-nums"
                    }
                  >
                    {Math.round(display.temperature)}°
                    {item.unit === "celsius" ? "C" : "F"}
                  </strong>
                </div>
                {!compact && (
                  <CollectionViewport label={t("widgets.forecast")}>
                    {display.forecast.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between gap-2 py-2 text-xs"
                      >
                        <time dateTime={day.date}>{day.date.slice(5)}</time>
                        <span className="tabular-nums">
                          {Math.round(day.low)}° / {Math.round(day.high)}°
                        </span>
                      </div>
                    ))}
                  </CollectionViewport>
                )}
              </>
            )}
            {display?.kind === "github-repo" &&
              item.kind === "github-repo" && (
                <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto">
                  {preview ? (
                    <span className="truncate text-xs">owner/repository</span>
                  ) : (
                    <a
                      href={`https://github.com/${item.repository}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="truncate text-xs underline underline-offset-2"
                    >
                      {item.repository}
                    </a>
                  )}
                  <dl className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-xs">
                    <div>
                      <dt className="text-muted-foreground">
                        {t("widgets.stars")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {display.stars.toLocaleString(i18n.resolvedLanguage)}
                      </dd>
                    </div>
                    {!compact && (
                      <div>
                        <dt className="text-muted-foreground">
                          {t("widgets.forks")}
                        </dt>
                        <dd className="font-medium tabular-nums">
                          {display.forks.toLocaleString(i18n.resolvedLanguage)}
                        </dd>
                      </div>
                    )}
                    <div>
                      <dt className="text-muted-foreground">
                        {t("widgets.openItems")}
                      </dt>
                      <dd className="font-medium tabular-nums">
                        {display.openItems}
                      </dd>
                    </div>
                  </dl>
                  {!compact && (
                    <p className="line-clamp-2 text-xs text-muted-foreground">
                      {display.description}
                    </p>
                  )}
                  {!compact && display.pushedAt && (
                    <p className="text-[10px] text-muted-foreground">
                      {t("widgets.lastPush")}:{" "}
                      {new Date(display.pushedAt).toLocaleDateString(
                        i18n.resolvedLanguage
                      )}
                    </p>
                  )}
                </div>
              )}
            {display?.kind === "rss" && (
              <CollectionViewport label={item.name}>
                {display.entries.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    {t("widgets.emptyFeed")}
                  </p>
                ) : (
                  <CollectionGrid className="space-y-2">
                    {display.entries.map((entry) => (
                      <CollectionRow key={entry.url}>
                        {preview ? (
                          <span className="line-clamp-2 text-sm">
                            {entry.title}
                          </span>
                        ) : (
                          <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="line-clamp-2 rounded-lg p-1 text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            {entry.title}
                          </a>
                        )}
                      </CollectionRow>
                    ))}
                  </CollectionGrid>
                )}
              </CollectionViewport>
            )}
            {error && (
              <p
                role="alert"
                className="overflow-auto text-xs text-destructive"
              >
                {t(`widgets.errors.${error}`)}
              </p>
            )}
          </div>
          {preview ? (
            <span className="text-[10px] text-muted-foreground">
              {t("widgets.previewOnly")}
            </span>
          ) : (
            <footer className="flex shrink-0 items-center justify-between gap-2 text-[10px] text-muted-foreground">
              {item.kind === "weather" ? (
                <a
                  href="https://open-meteo.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate underline"
                >
                  Open-Meteo
                </a>
              ) : (
                <span
                  title={source?.origin}
                  className="truncate"
                >
                  {source?.hostname}
                </span>
              )}
              <button
                type="button"
                disabled={loading}
                className="shrink-0 rounded px-1 text-foreground outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                aria-label={t("widgets.loadFrom", {
                  origin: source?.origin,
                })}
                onClick={() => {
                  void load()
                }}
              >
                {t(
                  loading
                    ? "widgets.loading"
                    : data
                      ? "widgets.refresh"
                      : "widgets.load"
                )}
              </button>
            </footer>
          )}
        </>
      )}
    </Frame>
  )
}

export default function UtilityWidgetTile(props: Props) {
  const { item } = props
  switch (item.kind) {
    case "clock":
      return <ClockTile {...props} item={item} />
    case "countdown":
      return <CountdownTile {...props} item={item} />
    case "note":
      return <NoteTile {...props} item={item} />
    case "pomodoro":
      return <PomodoroTile {...props} item={item} />
    case "photo":
      return <PhotoTile {...props} item={item} />
    case "bookmark-list":
      return <BookmarkListTile {...props} item={item} />
    case "world-clock":
      return <WorldClockTile {...props} item={item} />
    case "weather":
    case "rss":
    case "github-repo":
      return (
        <RemoteTile
          key={`${item.id}:${remoteSourceKey(item)}`}
          {...props}
          item={item}
        />
      )
  }
}
