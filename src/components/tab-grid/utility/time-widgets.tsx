import ClockDigits from "@/components/dot-matrix/clock-digits"
import { useEffect, type CSSProperties } from "react"
import {
  Stop,
  Plus,
  Briefcase,
  Coffee,
  Pause,
  Play,
  Moon,
  Sun,
} from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useWallClock } from "@/components/effects/use-wall-clock"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { UtilityWidgetItem } from "@/lib/grid/utility-types"
import {
  completePomodoro,
  daysUntil,
  formatDuration,
  localDateKey,
  remainingTime,
  pomodoroPhaseMinutes,
  resetPomodoro,
  togglePomodoro,
} from "@/lib/widgets/model"
import {
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
import { Dial, WidgetAction, WidgetSurface, type WidgetProps } from "./surface"

type KindProps<K extends UtilityWidgetItem["kind"]> = WidgetProps<
  Extract<UtilityWidgetItem, { kind: K }>
>

export function ClockTile(props: KindProps<"clock">) {
  const { item, sample = false } = props
  const { i18n } = useTranslation()
  const now = useWallClock(sample)
  const value = clockReading(
    now,
    i18n.resolvedLanguage ?? "en",
    item.timeZone,
    false
  )
  const tall = item.size === "tall"
  const parts = tall ? value.time.split(":") : [value.time]
  return (
    <WidgetSurface
      {...props}
      header={false}
      background={false}
      className="utility-clock"
    >
      <time
        className="utility-clock-time"
        dateTime={new Date(now).toISOString()}
        aria-label={value.time}
        style={{ color: item.color }}
      >
        {item.effect === "dots" ? (
          <ClockDigits text={value.time} color={item.color} stacked={tall} />
        ) : (
          parts.map((part, index) => (
            <span
              key={index}
              className="utility-clock-digits"
              aria-hidden="true"
            >
              {part}
            </span>
          ))
        )}
      </time>
    </WidgetSurface>
  )
}

export function CountdownTile(props: KindProps<"countdown">) {
  const { item, preview, sample = false, onOpen } = props
  const { t } = useTranslation()
  const now = useWallClock(sample)
  const first = item.event
  const compact = item.size === "wide"
  const days = first ? daysUntil(first.date, now) : null
  const digits = days === null ? "—" : String(Math.abs(days))
  return (
    <WidgetSurface {...props} header={false} className="utility-countdown">
      {!first ? (
        <div className="utility-countdown-empty">
          {preview ? (
            <span className="utility-countdown-add" aria-hidden="true">
              <Plus size={24} weight="bold" />
            </span>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              className="utility-countdown-add"
              aria-label={t("widgets.addEvent")}
              onClick={onOpen}
            >
              <Plus className="size-6" weight="bold" />
            </Button>
          )}
          <span>{t("widgets.addEvent")}</span>
        </div>
      ) : (
        <>
          <div className="utility-countdown-hero">
            <div
              className="utility-countdown-number"
              aria-label={
                days === 0
                  ? t("widgets.today")
                  : t(
                      days !== null && days > 0
                        ? "widgets.daysLeft"
                        : "widgets.daysAgo",
                      { count: Math.abs(days ?? 0) }
                    )
              }
              data-long={digits.length > 4 || undefined}
              style={
                {
                  "--count-font": `${countdownFontSize(digits, compact)}px`,
                } as CSSProperties
              }
            >
              <strong>{digits}</strong>
              {compact && <span>{t("widgets.dayUnit")}</span>}
            </div>
            <div className="utility-countdown-event">
              <strong title={first.title}>{first.title}</strong>
            </div>
          </div>
        </>
      )}
    </WidgetSurface>
  )
}

export function PomodoroTile(props: KindProps<"pomodoro">) {
  const { item: sourceItem, preview, sample = false } = props
  const { t } = useTranslation()
  const now = useWallClock(sample)
  const item =
    preview && !sample ? completePomodoro(sourceItem, now) : sourceItem
  const left = remainingTime(item, now)
  const shownLeft = sample ? 18 * 60_000 + 42_000 : left
  const progress = timerProgress(shownLeft, pomodoroPhaseMinutes(item))
  useEffect(() => {
    if (preview || item.endsAt === null || item.endsAt > now) return
    updateUtilityWidget(item.id, (current) =>
      current.kind === "pomodoro" ? completePomodoro(current, now) : current
    )
  }, [item.id, item.endsAt, now, preview])
  const running = item.endsAt !== null
  const count = item.completedOn === localDateKey(now) ? item.completedToday : 0
  const countLabel = t("widgets.sessionsToday", { count })
  const countText = count > 99 ? "99+" : count
  const phaseLabel = t(
    item.phase === "break" ? "widgets.breakPhase" : "widgets.workPhase"
  )
  return (
    <WidgetSurface {...props} header={false} className="utility-pomodoro">
      <span
        className="utility-timer-status"
        role="img"
        aria-label={phaseLabel}
        title={phaseLabel}
      >
        {item.phase === "break" ? (
          <Coffee size={20} aria-hidden="true" />
        ) : (
          <Briefcase size={20} aria-hidden="true" />
        )}
      </span>
      {preview ? (
        <span className="utility-timer-count" aria-label={countLabel}>
          {countText}
        </span>
      ) : (
        <Popover>
          <PopoverTrigger
            aria-label={countLabel}
            title={countLabel}
            render={
              <Button
                variant="ghost"
                size="icon"
                className="utility-timer-count"
              />
            }
          >
            {countText}
          </PopoverTrigger>
          <PopoverContent
            align="end"
            className="w-auto rounded-xl p-3"
            aria-label={countLabel}
          >
            {countLabel}
          </PopoverContent>
        </Popover>
      )}
      <div className="utility-focus-ring">
        <svg viewBox="0 0 160 160" aria-hidden="true">
          <circle cx="80" cy="80" r="70" className="utility-ring-track" />
          <circle
            cx="80"
            cy="80"
            r="70"
            pathLength="100"
            strokeDasharray="100"
            strokeDashoffset={100 * (1 - progress)}
            transform="rotate(-90 80 80)"
            className="utility-ring-progress"
          />
        </svg>
        <div className="utility-focus-readout">
          <span className="utility-focus-time" role="timer" aria-live="off">
            {formatDuration(shownLeft)}
          </span>
        </div>
      </div>
      <div className="utility-timer-controls">
        {preview ? (
          <>
            <span className="utility-action utility-timer-stop">
              <Stop size={16} weight="fill" />
            </span>
            <span className="utility-timer-primary">
              {running ? (
                <Pause size={18} weight="fill" />
              ) : (
                <Play size={18} weight="fill" />
              )}
            </span>
          </>
        ) : (
          <>
            <WidgetAction
              label={t("widgets.stop")}
              className="utility-timer-stop"
              onClick={() =>
                updateUtilityWidget(item.id, (current) =>
                  current.kind === "pomodoro" ? resetPomodoro(current) : current
                )
              }
            >
              <Stop size={16} weight="fill" />
            </WidgetAction>
            <Button
              size="icon"
              className="utility-timer-primary"
              title={t(running ? "widgets.pause" : "widgets.start")}
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
                <Pause size={18} weight="fill" />
              ) : (
                <Play size={18} weight="fill" />
              )}
            </Button>
          </>
        )}
      </div>
      {!preview && (
        <span className="sr-only" role="status">
          {left === 0 ? t("widgets.completed") : ""}
        </span>
      )}
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
