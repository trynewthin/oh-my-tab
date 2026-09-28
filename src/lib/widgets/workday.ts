export type WorkdaySchedule = { startTime: string; endTime: string }

export function validWorkdaySchedule(value: WorkdaySchedule) {
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/
  return (
    typeof value.startTime === "string" &&
    typeof value.endTime === "string" &&
    time.test(value.startTime) &&
    time.test(value.endTime) &&
    value.startTime !== value.endTime
  )
}

/** Daily local wall times; date arithmetic also handles overnight shifts and DST. */
export function workdayReading(schedule: WorkdaySchedule, now: number) {
  const at = (time: string, offset = 0) => {
    const date = new Date(now)
    const [hours, minutes] = time.split(":").map(Number)
    date.setDate(date.getDate() + offset)
    date.setHours(hours, minutes, 0, 0)
    return date.getTime()
  }
  let start = at(schedule.startTime)
  let end = at(schedule.endTime)
  if (schedule.endTime < schedule.startTime) {
    if (now < end) start = at(schedule.startTime, -1)
    else if (now >= start) end = at(schedule.endTime, 1)
    else start = at(schedule.startTime, -1)
  }
  const phase = now < start ? "before" : now < end ? "working" : "done"
  return {
    phase,
    start,
    end,
    remainingMs: Math.max(0, (phase === "before" ? start : end) - now),
    progress: Math.max(0, Math.min(1, (now - start) / (end - start))),
    celebrating: phase === "done" && now - end < 4_000,
  }
}

export function workdayDigits(remainingMs: number) {
  const ms = Math.max(0, Math.floor(remainingMs))
  const seconds = Math.floor(ms / 1000)
  const pad = (value: number) => String(value).padStart(2, "0")
  return {
    time: `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`,
    fraction: String(ms % 1000).padStart(3, "0"),
  }
}
