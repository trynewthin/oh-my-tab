import { useEffect, type CSSProperties } from "react"
import {
  ArrowCounterClockwise,
  CalendarBlank,
  Pause,
  Play,
  Moon,
  Sun,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useWallClock } from "@/components/effects/use-wall-clock"
import { Button } from "@/components/ui/button"
import type { UtilityWidgetItem } from "@/lib/grid/utility-types"
import {
  completePomodoro,
  daysUntil,
  formatDuration,
  localDateKey,
  remainingTime,
  resetPomodoro,
  togglePomodoro,
} from "@/lib/widgets/model"
import {
  calendarLabel,
  clockReading,
  countdownFontSize,
  timerProgress,
} from "@/lib/widgets/presentation"
import { updateUtilityWidget } from "@/stores/widget-actions"
import {
  CollectionGrid,
  CollectionRow,
  CollectionViewport,
} from "../collection/layout"
import {
  Dial,
  WidgetAction,
  WidgetEmpty,
  WidgetSurface,
  type WidgetProps,
} from "./surface"

type KindProps<K extends UtilityWidgetItem["kind"]> = WidgetProps<
  Extract<UtilityWidgetItem, { kind: K }>
>

export function ClockTile(props: KindProps<"clock">) {
  const { item, preview, onOpen } = props
  const { i18n, t } = useTranslation()
  const now = useWallClock(preview)
  const value = clockReading(
    now,
    i18n.resolvedLanguage ?? "en",
    item.timeZone,
    item.hour12
  )
  const content = (
    <>
      <span className="utility-clock-caption">
        <span className="utility-eyebrow">
          {item.size === "small" ? item.name : value.weekday}
        </span>
        <span className="utility-pixels" aria-hidden="true">
          <i />
          <i />
          <i />
          <i />
        </span>
      </span>
      <time
        className="utility-clock-time"
        dateTime={new Date(now).toISOString()}
        aria-label={`${value.time}${item.showSeconds ? `:${value.seconds}` : ""} ${value.period}`}
      >
        <span>{value.time}</span>
        {(item.showSeconds || item.hour12) && (
          <span className="utility-clock-detail">
            {item.showSeconds && <span>{value.seconds}</span>}
            {value.period && (
              <span className="utility-period">{value.period}</span>
            )}
          </span>
        )}
      </time>
      {item.size !== "small" && (
        <span className="utility-clock-date">
          <span>{value.date}</span>
          <span className="utility-clock-zone">
            {item.timeZone
              ? item.timeZone.split("/").at(-1)?.replaceAll("_", " ")
              : item.name}
          </span>
        </span>
      )}
    </>
  )
  return (
    <WidgetSurface {...props} header={false} className="utility-clock">
      {preview ? (
        <div className="utility-clock-layout">{content}</div>
      ) : (
        <button
          type="button"
          className="utility-clock-layout utility-focus"
          aria-label={`${item.name} · ${t("widgets.configure")}`}
          onClick={onOpen}
        >
          {content}
        </button>
      )}
    </WidgetSurface>
  )
}

export function CountdownTile(props: KindProps<"countdown">) {
  const { item, preview, sample = preview } = props
  const { t, i18n } = useTranslation()
  const now = useWallClock(preview)
  const events =
    sample && item.events.length === 0
      ? [
          {
            id: "sample",
            title: t("widgets.design.eventPreview"),
            date: "2026-01-22",
          },
        ]
      : item.events
  const first = events[0]
  const compact = item.size === "medium"
  const days = first ? daysUntil(first.date, now) : null
  const digits = days === null ? "—" : String(Math.abs(days))
  const relation =
    days === null
      ? ""
      : t(
          days === 0
            ? "widgets.today"
            : days > 0
              ? "widgets.design.remaining"
              : "widgets.design.elapsed"
        )
  return (
    <WidgetSurface {...props} className="utility-countdown">
      {!first ? (
        <WidgetEmpty
          {...props}
          icon={<CalendarBlank size={30} weight="light" />}
          title={t("widgets.design.addDate")}
          hint={t("widgets.design.countdownHint")}
        />
      ) : (
        <>
          <div className="utility-countdown-hero">
            <div
              className="utility-countdown-number"
              data-long={digits.length > 4 || undefined}
              style={
                {
                  "--count-font": `${countdownFontSize(digits, compact)}px`,
                } as CSSProperties
              }
            >
              <strong>{digits}</strong>
              <span>{relation}</span>
            </div>
            <div className="utility-countdown-event">
              <strong title={first.title}>{first.title}</strong>
              <time dateTime={first.date}>
                {calendarLabel(first.date, i18n.resolvedLanguage ?? "en")}
              </time>
            </div>
          </div>
          {!compact && events.length > 1 && (
            <CollectionViewport
              label={item.name}
              className="utility-countdown-list"
            >
              <CollectionGrid>
                {events.slice(1).map((event) => {
                  const distance = daysUntil(event.date, now)
                  return (
                    <CollectionRow
                      key={event.id}
                      className="utility-countdown-row"
                    >
                      <span title={event.title}>{event.title}</span>
                      <strong>
                        {distance === null
                          ? "—"
                          : distance === 0
                            ? t("widgets.today")
                            : t(
                                distance > 0
                                  ? "widgets.daysLeft"
                                  : "widgets.daysAgo",
                                { count: Math.abs(distance) }
                              )}
                      </strong>
                    </CollectionRow>
                  )
                })}
              </CollectionGrid>
            </CollectionViewport>
          )}
          {!compact && events.length === 1 && (
            <div className="utility-countdown-rule" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
              <span />
            </div>
          )}
        </>
      )}
    </WidgetSurface>
  )
}

export function PomodoroTile(props: KindProps<"pomodoro">) {
  const { item, preview, sample = preview } = props
  const { t } = useTranslation()
  const now = useWallClock(preview)
  const left = remainingTime(item, now)
  const shownLeft = sample ? 18 * 60_000 + 42_000 : left
  const progress = timerProgress(shownLeft, item.minutes)
  useEffect(() => {
    if (preview || item.endsAt === null || item.endsAt > now) return
    updateUtilityWidget(item.id, (current) =>
      current.kind === "pomodoro" ? completePomodoro(current, now) : current
    )
  }, [item.id, item.endsAt, now, preview])
  const count = item.completedOn === localDateKey(now) ? item.completedToday : 0
  const running = item.endsAt !== null
  const label = t(
    running ? "widgets.design.pauseShort" : "widgets.design.startShort"
  )
  return (
    <WidgetSurface
      {...props}
      className="utility-pomodoro"
      footer={
        <span role={preview ? undefined : "status"}>
          {left === 0 && !preview
            ? t("widgets.completed")
            : t("widgets.sessionsToday", { count })}
        </span>
      }
    >
      <div className="utility-focus-ring">
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r="74" className="utility-ring-track" />
          <circle
            cx="80"
            cy="80"
            r="74"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - progress)}
            transform="rotate(-90 80 80)"
            className="utility-ring-progress"
          />
        </svg>
        <div className="utility-focus-readout">
          <span className="utility-eyebrow">
            {t(running ? "widgets.design.focusing" : "widgets.design.yourPace")}
          </span>
          <span className="utility-focus-time" role="timer" aria-live="off">
            {formatDuration(shownLeft)}
          </span>
        </div>
      </div>
      <div className="utility-timer-controls">
        {preview ? (
          <span className="utility-timer-primary">
            <Play size={14} weight="fill" />
            {label}
          </span>
        ) : (
          <>
            <Button
              className="utility-timer-primary"
              onClick={() =>
                updateUtilityWidget(item.id, (current) =>
                  current.kind === "pomodoro"
                    ? togglePomodoro(current)
                    : current
                )
              }
              aria-label={t(running ? "widgets.pause" : "widgets.start")}
            >
              {running ? (
                <Pause size={14} weight="fill" />
              ) : (
                <Play size={14} weight="fill" />
              )}
              {label}
            </Button>
            <WidgetAction
              label={t("widgets.reset")}
              onClick={() =>
                updateUtilityWidget(item.id, (current) =>
                  current.kind === "pomodoro" ? resetPomodoro(current) : current
                )
              }
            >
              <ArrowCounterClockwise size={16} />
            </WidgetAction>
          </>
        )}
      </div>
    </WidgetSurface>
  )
}

export function WorldClockTile(props: KindProps<"world-clock">) {
  const { item, preview } = props
  const { t, i18n } = useTranslation()
  const now = useWallClock(preview)
  const locale = i18n.resolvedLanguage ?? "en"
  return (
    <WidgetSurface {...props} className="utility-world">
      <CollectionViewport label={item.name}>
        <CollectionGrid>
          {item.zones.map((zone) => {
            const value = clockReading(now, locale, zone.timeZone, item.hour12)
            const night = value.hour < 6 || value.hour >= 18
            return (
              <CollectionRow key={zone.id} className="utility-world-row">
                <Dial hour={value.hour} minute={value.minute} />
                <div className="utility-world-place">
                  <strong title={zone.label}>{zone.label}</strong>
                  <span>{value.date}</span>
                </div>
                <time
                  dateTime={new Date(now).toISOString()}
                  className="utility-world-time"
                >
                  <span>{value.time}</span>
                  {value.period && <small>{value.period}</small>}
                </time>
                <span
                  className="utility-world-phase"
                  title={t(
                    night
                      ? "widgets.design.localNight"
                      : "widgets.design.localDay"
                  )}
                  aria-label={t(
                    night
                      ? "widgets.design.localNight"
                      : "widgets.design.localDay"
                  )}
                >
                  {night ? <Moon size={13} /> : <Sun size={13} />}
                </span>
              </CollectionRow>
            )
          })}
        </CollectionGrid>
      </CollectionViewport>
    </WidgetSurface>
  )
}
