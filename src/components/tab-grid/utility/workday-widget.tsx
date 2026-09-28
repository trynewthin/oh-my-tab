import type { CSSProperties } from "react"
import { Door, DoorOpen } from "@phosphor-icons/react"
import { useTranslation } from "react-i18next"
import { useWallClock } from "@/components/effects/use-wall-clock"
import { usePreciseClock } from "@/components/effects/use-precise-clock"
import type { UtilityWidgetItem } from "@/lib/grid/utility-types"
import { workdayDigits, workdayReading } from "@/lib/widgets/workday"
import { WidgetSurface, type WidgetProps } from "./surface"
import "./workday.css"

export default function WorkdayTile(
  props: WidgetProps<Extract<UtilityWidgetItem, { kind: "workday" }>>
) {
  const { item, sample = false, preview } = props
  const { t } = useTranslation()
  const clockTime = useWallClock(sample)
  const sampleShift = workdayReading(item, clockTime)
  const wallTime = sample
    ? (sampleShift.start + sampleShift.end) / 2 + 123
    : clockTime
  const active = workdayReading(item, wallTime).phase === "working"
  const now = usePreciseClock(active && !sample, wallTime)
  const reading = workdayReading(item, now)
  const digits = workdayDigits(reading.remainingMs)
  const done = reading.phase === "done"
  const lastMinute =
    reading.phase === "working" && reading.remainingMs <= 60_000
  const label = t(`widgets.workday.${reading.phase}`)

  return (
    <WidgetSurface {...props} header={false} className="utility-workday">
      <div
        className="workday-scene"
        data-phase={reading.phase}
        data-finale={lastMinute || undefined}
        data-celebrating={(!preview && reading.celebrating) || undefined}
      >
        <div className="workday-readout">
          {!done && (
            <span className="workday-label" role="status">
              {label}
            </span>
          )}
          {done ? (
            <strong className="workday-free" role="status">
              {t("widgets.workday.free")}
            </strong>
          ) : (
            <span
              className="workday-time"
              role="timer"
              aria-live="off"
              aria-label={`${label} ${digits.time}`}
            >
              <strong>{digits.time}</strong>
              <span className="workday-fraction" aria-hidden="true">
                .{digits.fraction}
              </span>
            </span>
          )}
        </div>
        <div
          className="workday-route"
          aria-hidden="true"
          style={
            {
              "--workday-progress": `${reading.progress * 100}%`,
            } as CSSProperties
          }
        >
          <div className="workday-track">
            <div className="workday-fill" />
            <span className="workday-traveler" />
          </div>
          <span className="workday-exit">
            {done ? <DoorOpen size={22} weight="fill" /> : <Door size={22} />}
          </span>
        </div>
        <div className="workday-burst" aria-hidden="true">
          {Array.from({ length: 12 }, (_, index) => (
            <i key={index} style={{ "--ray": index } as CSSProperties} />
          ))}
        </div>
      </div>
    </WidgetSurface>
  )
}
