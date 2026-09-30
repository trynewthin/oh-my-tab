export const DEFAULT_STAR_TRAIL_SPEED = 1
export const MIN_STAR_TRAIL_SPEED = 0
export const MAX_STAR_TRAIL_SPEED = 2

const ROTATION_PER_SECOND = 0.15
export const STAR_TRAIL_EXPOSURE_SECONDS = 8
const TAU = Math.PI * 2

type OrbitSample = { time: number; angle: number }
export type StarTrailFrame = {
  angle: number
  segments: { from: number; to: number; opacity: number }[]
}

export type StarTrail = {
  radius: number
  angle: number
  span: number
  brightness: number
  width: number
}

function random(seed: number, index: number) {
  const value = Math.sin(seed * 12.9898 + index * 78.233) * 43758.5453
  return value - Math.floor(value)
}

export function createStarTrails(seed: number, width: number, height: number) {
  const center = { x: width * 0.78, y: height * 0.58 }
  const radius = Math.max(
    Math.hypot(center.x, center.y),
    Math.hypot(width - center.x, center.y),
    Math.hypot(center.x, height - center.y),
    Math.hypot(width - center.x, height - center.y)
  )
  const density = height < 80 ? 0.34 : height < 200 ? 0.4 : 0.48
  const count = Math.max(16, Math.min(400, Math.round(radius * density * 1.2)))
  const trails: StarTrail[] = Array.from({ length: count }, (_, index) => ({
    radius: 3 + ((index + random(seed, index + 1)) / count) * radius,
    angle: random(seed + 17, index + 1) * TAU,
    span: Math.min(
      Math.PI * 1.75,
      (0.5 + Math.pow(random(seed + 29, index + 1), 0.7) * 2.8) * 1.55
    ),
    brightness: 0.13 + Math.pow(random(seed + 43, index + 1), 2) * 0.55,
    width: 0.4 + random(seed + 59, index + 1) * 0.5,
  }))
  return { center, radius: radius + 8, trails }
}

export function createStarTrailClock() {
  let angle = 0
  let elapsed = 0
  let lastMovement = 0
  let formationRotation = 0
  let previousSpan = 0
  let previousTime: number | undefined
  let history: OrbitSample[] = [{ time: 0, angle: 0 }]

  const angleAt = (time: number) => {
    let cursor = 0
    while (cursor < history.length - 1 && history[cursor + 1].time <= time)
      cursor++
    const from = history[cursor]
    const to = history[cursor + 1]
    if (time <= from.time || !to) return from.angle
    const blend = (time - from.time) / (to.time - from.time)
    return from.angle + (to.angle - from.angle) * blend
  }

  const snapshot = (): StarTrailFrame => {
    const from = angleAt(elapsed - STAR_TRAIL_EXPOSURE_SECONDS)
    const head = angle + formationRotation
    const fade = Math.pow(
      Math.max(0, 1 - (elapsed - lastMovement) / STAR_TRAIL_EXPOSURE_SECONDS),
      1.8
    )
    const segments =
      angle - from > 0.000001 && fade > 0
        ? [{ from: from + formationRotation, to: head, opacity: fade }]
        : []
    return { angle: head, segments }
  }

  return {
    sample(time: number | undefined, speed: number) {
      if (time === undefined) {
        // Reduced motion presents stars at their current positions.
        previousTime = undefined
        history = [{ time: elapsed, angle }]
        previousSpan = 0
        return snapshot()
      }
      if (previousTime !== undefined) {
        const delta = Math.min(0.25, Math.max(0, time - previousTime))
        elapsed += delta
        const movement = delta * ROTATION_PER_SECOND * Math.max(0, speed)
        angle += movement
        if (movement > 0) lastMovement = elapsed
        const next = { time: elapsed, angle }
        const last = history[history.length - 1]
        const before = history[history.length - 2]
        if (
          last.time === elapsed ||
          (last.angle === angle && before?.angle === angle)
        )
          history[history.length - 1] = next
        else history.push(next)
        const cutoff = elapsed - STAR_TRAIL_EXPOSURE_SECONDS
        while (history.length > 1 && history[1].time <= cutoff) history.shift()
        const span = angle - angleAt(cutoff)
        // Grow around the rotating orbit rather than anchoring its tail.
        // Keep the head's formation offset when stopped so stars stay put.
        if (movement > 0)
          formationRotation += Math.max(0, span - previousSpan) / 2
        previousSpan = span
      }
      previousTime = time
      return snapshot()
    },
    snapshot,
    form() {
      const span = Math.max(
        ROTATION_PER_SECOND * STAR_TRAIL_EXPOSURE_SECONDS,
        angle - angleAt(elapsed - STAR_TRAIL_EXPOSURE_SECONDS)
      )
      elapsed = Math.max(elapsed, STAR_TRAIL_EXPOSURE_SECONDS)
      history = [
        { time: elapsed - STAR_TRAIL_EXPOSURE_SECONDS, angle: angle - span },
        { time: elapsed, angle },
      ]
      lastMovement = elapsed
      previousSpan = span
      previousTime = undefined
      return snapshot()
    },
    pause() {
      previousTime = undefined
    },
  }
}
