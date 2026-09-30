import {
  createStarTrailClock,
  createStarTrails,
  type StarTrail,
  type StarTrailFrame,
} from "@/lib/star-trails"

type Surface = {
  width: number
  height: number
  color: string
  starColor: string
  coverage: number
}
type StarPoint = StarTrail & { x: number; y: number }
type StarGroup = {
  stars: StarPoint[]
  brightness: number
  width: number
}

const TEXTURE_MAX_SIZE = 2048
const EXPOSURE_REFRESH_INTERVAL = 1 / 20

function groupStars(stars: StarTrail[]) {
  const groups = new Map<string, StarGroup>()
  for (const star of stars) {
    const brightness = Math.floor((star.brightness - 0.13) / 0.11)
    const width = Math.floor((star.width - 0.4) / 0.17)
    const key = `${brightness}:${width}`
    let group = groups.get(key)
    if (!group) {
      group = {
        stars: [],
        brightness: 0.185 + brightness * 0.11,
        width: 0.485 + width * 0.17,
      }
      groups.set(key, group)
    }
    group.stars.push({
      ...star,
      x: Math.cos(star.angle) * star.radius,
      y: Math.sin(star.angle) * star.radius,
    })
  }
  return [...groups.values()]
}

function exposureKey(state: StarTrailFrame) {
  return state.segments
    .map((segment) =>
      [segment.from - state.angle, segment.to - state.angle, segment.opacity]
        .map((value) => Math.round(value * 100000))
        .join(":")
    )
    .join("|")
}

export function createStarTrailsCanvas(
  canvas: HTMLCanvasElement,
  seed: number
) {
  const context = canvas.getContext("2d")
  if (!context) return null
  const texture = document.createElement("canvas")
  const textureContext = texture.getContext("2d")
  if (!textureContext) return null
  const clock = createStarTrailClock()
  let surface: Surface | undefined
  let resolution = 1
  let textureResolution = 1
  let radius = 0
  let center = { x: 0, y: 0 }
  let groups: StarGroup[] = []
  let mask: CanvasGradient | undefined
  let glow: CanvasGradient | undefined
  let frame = clock.snapshot()
  let textureDirty = true
  let textureKey = ""
  let textureHasTrails = false
  let lastExposureRefresh = -Infinity

  const updateTexture = (state: StarTrailFrame, time?: number) => {
    if (!surface) return
    const key = exposureKey(state)
    const hasTrails = state.segments.length > 0
    if (!textureDirty && key === textureKey) return
    if (
      !textureDirty &&
      hasTrails === textureHasTrails &&
      time !== undefined &&
      time - lastExposureRefresh < EXPOSURE_REFRESH_INTERVAL
    )
      return
    const { height, starColor } = surface
    const intensity = height < 80 ? 0.95 * 0.65 : 0.95
    const diameter = radius * 2
    textureContext.setTransform(
      textureResolution,
      0,
      0,
      textureResolution,
      0,
      0
    )
    textureContext.clearRect(0, 0, diameter, diameter)
    textureContext.lineCap = "round"
    // Cache geometry relative to the stars' current angle. Steady rotation
    // reuses this bitmap; changing exposure is rebuilt at most 20 times/s.
    for (const segment of state.segments) {
      const relativeFrom = segment.from - state.angle
      const relativeTo = segment.to - state.angle
      const cos = Math.cos(relativeFrom),
        sin = Math.sin(relativeFrom)
      for (const group of groups) {
        textureContext.beginPath()
        let drawn = false
        for (const star of group.stars) {
          const from = Math.max(relativeFrom, -star.span)
          if (relativeTo - from <= 0.000001) continue
          const startCos = from === relativeFrom ? cos : Math.cos(from)
          const startSin = from === relativeFrom ? sin : Math.sin(from)
          textureContext.moveTo(
            radius + star.x * startCos - star.y * startSin,
            radius + star.x * startSin + star.y * startCos
          )
          textureContext.arc(
            radius,
            radius,
            star.radius,
            star.angle + from,
            star.angle + relativeTo
          )
          drawn = true
        }
        if (!drawn) continue
        const alpha = Math.min(0.95, 0.4 + group.brightness * 0.7) * intensity
        textureContext.strokeStyle = starColor
        textureContext.globalAlpha = alpha * segment.opacity
        textureContext.lineWidth = 1.1 + group.width * 1.2
        textureContext.stroke()
      }
    }
    for (const group of groups) {
      const alpha = Math.min(0.95, 0.4 + group.brightness * 0.7) * intensity
      const opacity = state.segments[0]?.opacity ?? 0
      // The round line cap already depicts the star at full exposure.
      // During fade, compensate its opacity instead of doubling the head.
      const pointAlpha = (alpha * (1 - opacity)) / (1 - alpha * opacity)
      if (pointAlpha <= 0) continue
      textureContext.beginPath()
      const size = (1.1 + group.width * 1.2) / 2
      for (const star of group.stars) {
        textureContext.moveTo(radius + star.x + size, radius + star.y)
        textureContext.arc(
          radius + star.x,
          radius + star.y,
          size,
          0,
          Math.PI * 2
        )
      }
      textureContext.fillStyle = starColor
      textureContext.globalAlpha = pointAlpha
      textureContext.fill()
    }
    textureContext.globalAlpha = 1
    textureDirty = false
    textureKey = key
    textureHasTrails = hasTrails
    lastExposureRefresh = time ?? -Infinity
  }

  const draw = (state: StarTrailFrame, visibility: number, time?: number) => {
    if (!surface) return
    const { width, height } = surface
    context.setTransform(resolution, 0, 0, resolution, 0, 0)
    context.clearRect(0, 0, width, height)
    if (visibility <= 0) return
    updateTexture(state, time)
    context.save()
    const reveal = Math.min(1, visibility)
    if (glow) {
      context.globalAlpha = reveal * (height < 80 ? 0.05 : 0.1)
      context.fillStyle = glow
      context.fillRect(0, 0, width, height)
    }
    context.globalAlpha = reveal
    context.translate(center.x, center.y)
    context.rotate(state.angle)
    context.drawImage(texture, -radius, -radius, radius * 2, radius * 2)
    context.restore()
    if (mask) {
      context.save()
      context.globalCompositeOperation = "destination-in"
      context.fillStyle = mask
      context.fillRect(0, 0, width, height)
      context.restore()
    }
  }

  return {
    update(next: Surface) {
      if (next.width <= 0 || next.height <= 0) return
      const nextResolution = Math.min(window.devicePixelRatio || 1, 1.5)
      const previous = surface
      if (
        previous &&
        Object.entries(next).every(
          ([key, value]) => previous[key as keyof Surface] === value
        ) &&
        nextResolution === resolution
      )
        return
      surface = next
      resolution = nextResolution
      const { width, height, color, coverage } = next
      const field = createStarTrails(seed, width, height)
      center = field.center
      radius = field.radius
      groups = groupStars(field.trails)
      textureResolution = Math.min(resolution, TEXTURE_MAX_SIZE / (radius * 2))
      const textureSize = Math.min(
        TEXTURE_MAX_SIZE,
        Math.ceil(radius * 2 * textureResolution)
      )
      texture.width = texture.height = textureSize
      textureDirty = true
      canvas.width = Math.ceil(width * resolution)
      canvas.height = Math.ceil(height * resolution)
      context.setTransform(resolution, 0, 0, resolution, 0, 0)
      const glowRadius = Math.max(width, height) * 0.65
      glow = context.createRadialGradient(
        center.x,
        center.y,
        0,
        center.x,
        center.y,
        glowRadius
      )
      glow.addColorStop(0, color)
      glow.addColorStop(1, "transparent")
      const edge = 1 - Math.min(100, Math.max(0, coverage)) / 100
      mask = context.createLinearGradient(0, 0, width, 0)
      for (let index = 0; index <= 20; index++) {
        const position = index / 20
        const blend = Math.min(1, Math.max(0, (position - edge) / 0.2))
        mask.addColorStop(
          position,
          `rgba(0,0,0,${blend * blend * (3 - 2 * blend)})`
        )
      }
    },
    paint(time: number | undefined, visibility: number, speed: number) {
      frame = clock.sample(time, speed)
      draw(frame, visibility, time)
    },
    paintStatic(visibility: number) {
      frame = clock.form()
      draw(frame, visibility)
    },
    repaint(visibility: number) {
      draw(frame, visibility)
    },
    hasTrails() {
      return frame.segments.length > 0
    },
    pause: clock.pause,
    dispose() {
      clock.pause()
      groups = []
      surface = undefined
      mask = glow = undefined
      canvas.width = canvas.height = 0
      texture.width = texture.height = 0
    },
  }
}
