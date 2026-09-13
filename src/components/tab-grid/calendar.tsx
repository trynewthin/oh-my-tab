import FolderBackground from "./folder-background"
import { useEffect, useState } from "react"
import { CaretLeft, CaretRight } from "@phosphor-icons/react"
import type { CalendarItem } from "./types"

function CalendarContent({
  item,
  preview = false,
}: {
  item: CalendarItem
  preview?: boolean
}) {
  const [today, setToday] = useState(() => new Date())
  const [offset, setOffset] = useState(0)
  useEffect(() => {
    const update = () => setToday(new Date())
    const timer = window.setInterval(update, 30000)
    document.addEventListener("visibilitychange", update)
    return () => {
      clearInterval(timer)
      document.removeEventListener("visibilitychange", update)
    }
  }, [])
  const month = new Date(today.getFullYear(), today.getMonth() + offset, 1)
  const start = (month.getDay() + 6) % 7
  const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
  if (item.size === "medium")
    return (
      <section
        aria-label={item.name}
        className="flex h-full w-full cursor-default flex-col items-center justify-center gap-2 overflow-hidden rounded-[inherit] p-2 text-card-foreground"
      >
        <div
          aria-current="date"
          className="text-5xl leading-none font-semibold tabular-nums"
          style={{ color: item.color }}
        >
          {today.getDate()}
        </div>
        <div className="text-sm text-muted-foreground">
          星期{["日", "一", "二", "三", "四", "五", "六"][today.getDay()]}
        </div>
      </section>
    )
  if (item.size === "small")
    return (
      <section
        aria-label={item.name}
        className="grid h-full w-full cursor-default grid-cols-7 items-center gap-0.5 overflow-hidden rounded-[inherit] px-2 py-1 text-card-foreground"
      >
        {Array.from({ length: 7 }, (_, index) => {
          const date = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate() - ((today.getDay() + 6) % 7) + index
          )
          const active =
            date.getTime() ===
            new Date(
              today.getFullYear(),
              today.getMonth(),
              today.getDate()
            ).getTime()
          return (
            <div
              key={index}
              className="flex min-w-0 items-center justify-center"
            >
              <span
                aria-label={`${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`}
                aria-current={active ? "date" : undefined}
                className="flex aspect-square w-full max-w-7 items-center justify-center rounded-full text-sm font-medium tabular-nums sm:max-w-8 sm:text-base"
                style={
                  active
                    ? { backgroundColor: item.color, color: "white" }
                    : undefined
                }
              >
                {active
                  ? ["一", "二", "三", "四", "五", "六", "日"][index]
                  : date.getDate()}
              </span>
            </div>
          )
        })}
      </section>
    )
  return (
    <section
      aria-label={item.name}
      className="flex h-full min-h-0 w-full cursor-default flex-col rounded-[inherit] p-3 text-card-foreground sm:p-4"
    >
      <header className="mb-2 flex flex-wrap items-center justify-between gap-1">
        <div className="min-w-0">
          <h3 aria-live="polite" className="text-sm font-semibold tabular-nums">
            {month.getFullYear()}年{month.getMonth() + 1}月
          </h3>
        </div>
        <div
          className="flex shrink-0 items-center"
          onMouseDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            disabled={preview}
            aria-label="上个月"
            onClick={() => setOffset((v) => v - 1)}
            className="rounded-md p-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CaretLeft size={14} />
          </button>
          <button
            type="button"
            disabled={preview}
            onClick={() => {
              setToday(new Date())
              setOffset(0)
            }}
            className="rounded-md px-1 py-1 text-[10px] hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            今天
          </button>
          <button
            type="button"
            disabled={preview}
            aria-label="下个月"
            onClick={() => setOffset((v) => v + 1)}
            className="rounded-md p-1 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
          >
            <CaretRight size={14} />
          </button>
        </div>
      </header>
      <div className="grid grid-cols-7 text-center text-[10px] text-muted-foreground">
        {["一", "二", "三", "四", "五", "六", "日"].map((day) => (
          <span key={day} className="py-1">
            {day}
          </span>
        ))}
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-7 grid-rows-6 place-items-center text-xs tabular-nums">
        {Array.from({ length: 42 }, (_, index) => {
          const day = index - start + 1
          const active = offset === 0 && day === today.getDate()
          return (
            <span
              key={index}
              aria-current={active ? "date" : undefined}
              className={`flex aspect-square w-full max-w-6 items-center justify-center rounded-full ${active ? "font-semibold text-white" : index % 7 >= 5 ? "text-muted-foreground" : ""}`}
              style={
                active
                  ? {
                      backgroundColor: item.color,
                      color: "white",
                      boxShadow: "inset 0 0 0 20px rgba(0,0,0,.25)",
                    }
                  : undefined
              }
            >
              {day > 0 && day <= days ? day : ""}
            </span>
          )
        })}
      </div>
    </section>
  )
}

export default function Calendar({
  item,
  preview = false,
}: {
  item: CalendarItem
  preview?: boolean
}) {
  return (
    <div className="relative isolate h-full w-full overflow-hidden rounded-[inherit]">
      <FolderBackground
        color={item.color}
        animated={!preview && !!item.dynamicEffect}
      />
      <div className="relative z-10 h-full w-full rounded-[inherit]">
        <CalendarContent item={item} preview={preview} />
      </div>
    </div>
  )
}
