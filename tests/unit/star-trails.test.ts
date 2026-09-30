import { afterEach, describe, expect, test, vi } from "vitest"
import { createStarTrailsCanvas } from "@/components/effects/star-trails-canvas"
import {
  createStarTrailClock,
  createStarTrails,
  STAR_TRAIL_EXPOSURE_SECONDS,
  type StarTrailFrame,
} from "@/lib/star-trails"

function exposure(frame: StarTrailFrame) {
  return frame.segments.reduce(
    (total, segment) => total + (segment.to - segment.from) * segment.opacity,
    0
  )
}

function createContext() {
  const gradient = { addColorStop: vi.fn() }
  return {
    globalAlpha: 1,
    lineWidth: 1,
    strokeStyle: "",
    fillStyle: "",
    setTransform: vi.fn(),
    clearRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    arc: vi.fn<
      (x: number, y: number, radius: number, from: number, to: number) => void
    >(),
    stroke: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    translate: vi.fn(),
    rotate: vi.fn<(angle: number) => void>(),
    drawImage: vi.fn(),
    createLinearGradient: vi.fn(() => gradient),
    createRadialGradient: vi.fn(() => gradient),
  }
}

function createRenderer(width = 320, height = 160) {
  const context = createContext()
  const textureContext = createContext()
  const texture = { getContext: () => textureContext, width: 0, height: 0 }
  const canvas = { getContext: () => context, width: 0, height: 0 }
  vi.stubGlobal("document", { createElement: () => texture })
  const renderer = createStarTrailsCanvas(
    canvas as unknown as HTMLCanvasElement,
    37
  )!
  const surface = {
    width,
    height,
    color: "#3478f6",
    starColor: "#bbccee",
    coverage: 90,
  }
  renderer.update(surface)
  return { renderer, context, textureContext, canvas, texture, surface }
}

afterEach(() => vi.unstubAllGlobals())

describe("star trails", () => {
  test("creates a spaced, stable orbit field with varied exposures", () => {
    const field = createStarTrails(37, 640, 260)
    expect(field).toEqual(createStarTrails(37, 640, 260))
    expect(field).not.toEqual(createStarTrails(38, 640, 260))
    expect(field.trails.length).toBeGreaterThan(200)
    expect(field.trails.length).toBeLessThan(350)
    expect(
      new Set(field.trails.map((trail) => trail.span)).size
    ).toBeGreaterThan(100)
    for (const trail of field.trails) {
      expect(trail.radius).toBeGreaterThan(0)
      expect(trail.radius).toBeLessThan(field.radius)
      expect(trail.span).toBeGreaterThan(0)
      expect(trail.span).toBeLessThan(Math.PI * 2)
    }
  })

  test("starts with stars and forms trails only from actual movement", () => {
    const clock = createStarTrailClock()
    expect(clock.sample(undefined, 0)).toEqual({ angle: 0, segments: [] })
    expect(clock.sample(0, 0).segments).toEqual([])
    expect(clock.sample(0.1, 0).segments).toEqual([])
    const starting = clock.sample(0.2, 1)
    expect(starting.angle).toBeGreaterThan(0)
    expect(starting.segments.length).toBeGreaterThan(0)
    const growing = clock.sample(0.3, 1)
    expect(exposure(growing)).toBeGreaterThan(exposure(starting))
    expect(growing.segments[0].from).toBeGreaterThan(starting.segments[0].from)
    expect(growing.segments[0].to).toBeGreaterThan(starting.segments[0].to)
    for (const segment of growing.segments) {
      expect(segment.from).toBeGreaterThanOrEqual(0)
      expect(segment.to).toBeLessThanOrEqual(growing.angle)
    }
  })

  test("rotates both ends throughout formation and keeps moving at full exposure", () => {
    const clock = createStarTrailClock()
    clock.sample(0, 1)
    let previous = clock.sample(0.1, 1)
    for (let step = 2; step <= STAR_TRAIL_EXPOSURE_SECONDS * 10; step++) {
      const current = clock.sample(step / 10, 1)
      const before = previous.segments[0]
      const after = current.segments[0]
      expect(after.from).toBeGreaterThan(before.from)
      expect(after.to).toBeGreaterThan(before.to)
      expect(after.to - after.from).toBeGreaterThan(
        before.to - before.from - 0.000001
      )
      previous = current
    }
    const formed = clock.sample(STAR_TRAIL_EXPOSURE_SECONDS + 0.1, 1)
    expect(formed.segments[0].from).toBeGreaterThan(previous.segments[0].from)
    expect(formed.segments[0].to).toBeGreaterThan(previous.segments[0].to)
    expect(exposure(formed)).toBeCloseTo(exposure(previous))
  })

  test("changes speed continuously and fades trails while stopped", () => {
    const clock = createStarTrailClock()
    clock.sample(0, 1)
    const first = clock.sample(0.1, 1).angle
    const faster = clock.sample(0.2, 2)
    expect(faster.angle - first).toBeCloseTo(first * 2)
    const stopped = clock.sample(0.3, 0)
    expect(stopped.angle).toBe(faster.angle)
    expect(exposure(stopped)).toBeGreaterThan(0)

    let fading = stopped
    for (let step = 4; step <= 20; step++) fading = clock.sample(step / 10, 0)
    expect(fading.angle).toBe(stopped.angle)
    expect(exposure(fading)).toBeGreaterThan(0)
    expect(exposure(fading)).toBeLessThan(exposure(stopped))

    let finished = fading
    for (let step = 21; step <= (STAR_TRAIL_EXPOSURE_SECONDS + 1) * 10; step++)
      finished = clock.sample(step / 10, 0)
    expect(finished).toEqual({ angle: stopped.angle, segments: [] })
    const restarting = clock.sample(STAR_TRAIL_EXPOSURE_SECONDS + 1.1, 1)
    expect(restarting.angle - finished.angle).toBeCloseTo(first)
    expect(exposure(restarting)).toBeGreaterThan(0)
    expect(exposure(restarting)).toBeLessThan(exposure(stopped))
  })

  test("forms a complete still frame and resumes motion without resetting its position", () => {
    const clock = createStarTrailClock()
    clock.sample(0, 1)
    const growing = clock.sample(0.2, 1)
    const formed = clock.form()
    expect(formed.angle).toBe(growing.angle)
    expect(exposure(formed)).toBeGreaterThan(exposure(growing))
    expect(formed.segments[0].opacity).toBe(1)
    expect(clock.form()).toEqual(formed)
    expect(clock.sample(100, 1)).toEqual(formed)
    const resumed = clock.sample(100.1, 1)
    expect(resumed.angle).toBeGreaterThan(formed.angle)
    expect(exposure(resumed)).toBeCloseTo(exposure(formed))
  })

  test("freezes offscreen history and resumes without a time jump", () => {
    const clock = createStarTrailClock()
    clock.sample(0, 1)
    const moving = clock.sample(0.1, 1)
    clock.pause()
    expect(clock.sample(100, 1)).toEqual(moving)
    const resumed = clock.sample(100.1, 1)
    expect(resumed.angle - moving.angle).toBeCloseTo(moving.angle)
    expect(exposure(resumed)).toBeGreaterThan(exposure(moving))
  })

  test("reduced motion retains star positions and removes exposure trails", () => {
    const clock = createStarTrailClock()
    clock.sample(0, 1)
    const moving = clock.sample(0.1, 1)
    const reduced = clock.sample(undefined, 1)
    expect(reduced).toEqual({ angle: moving.angle, segments: [] })
    expect(clock.sample(200, 1)).toEqual(reduced)
    expect(clock.sample(200.1, 1).segments.length).toBeGreaterThan(0)
  })

  test("keeps exposure continuous when the stars cross a full rotation", () => {
    const clock = createStarTrailClock()
    clock.sample(0, 2)
    let frame = clock.snapshot()
    for (let step = 1; step <= 250; step++) frame = clock.sample(step / 10, 2)
    expect(frame.angle).toBeGreaterThan(Math.PI * 2)
    for (const segment of frame.segments) {
      expect(segment.to).toBeGreaterThan(segment.from)
      expect(segment.to - segment.from).toBeLessThan(Math.PI)
    }
    expect(exposure(frame)).toBeGreaterThan(0)
  })

  test("draws stars, retains fading trails and releases the cached texture", () => {
    const { renderer, context, textureContext, canvas, texture, surface } =
      createRenderer()
    renderer.paint(0, 1, 1)
    expect(textureContext.stroke).not.toHaveBeenCalled()
    expect(textureContext.fill).toHaveBeenCalled()
    expect(renderer.hasTrails()).toBe(false)

    renderer.paint(0.1, 1, 1)
    expect(textureContext.stroke).toHaveBeenCalled()
    expect(renderer.hasTrails()).toBe(true)
    const stoppedAngle = context.rotate.mock.lastCall![0]
    renderer.pause()
    renderer.paint(0.2, 1, 0)
    renderer.repaint(1)
    expect(renderer.hasTrails()).toBe(true)
    for (let step = 3; step <= (STAR_TRAIL_EXPOSURE_SECONDS + 1) * 10; step++)
      renderer.paint(step / 10, 1, 0)
    expect(renderer.hasTrails()).toBe(false)
    expect(context.rotate.mock.lastCall![0]).toBe(stoppedAngle)

    textureContext.stroke.mockClear()
    textureContext.arc.mockClear()
    renderer.update({ ...surface, starColor: "#ccddee" })
    renderer.repaint(1)
    expect(textureContext.stroke).not.toHaveBeenCalled()
    expect(textureContext.arc.mock.calls.length).toBeGreaterThan(0)
    expect(
      textureContext.arc.mock.calls.every(
        (call) => call[4] - call[3] === Math.PI * 2
      )
    ).toBe(true)
    renderer.dispose()
    expect(canvas.width).toBe(0)
    expect(texture.width).toBe(0)
    expect(texture.height).toBe(0)
  })

  test("uses each star's color, brightness and diameter for its uniform trail", () => {
    const { renderer, textureContext } = createRenderer()
    type Brush = { color: string; alpha: number; width: number }
    const points: Brush[] = []
    const trails: Brush[] = []
    textureContext.fill.mockImplementation(() => {
      points.push({
        color: textureContext.fillStyle,
        alpha: textureContext.globalAlpha,
        width: textureContext.arc.mock.lastCall![2] * 2,
      })
    })
    textureContext.stroke.mockImplementation(() => {
      trails.push({
        color: textureContext.strokeStyle,
        alpha: textureContext.globalAlpha,
        width: textureContext.lineWidth,
      })
    })
    renderer.paint(0, 1, 1)
    const stars = [...points]
    expect(new Set(stars.map((brush) => brush.alpha)).size).toBeGreaterThan(3)
    expect(stars.every((brush) => brush.color === "#bbccee")).toBe(true)

    points.length = 0
    renderer.paint(0.1, 1, 1)
    expect(trails).toEqual(stars)
    expect(points).toEqual([])
    // Full exposure uses the round line cap instead of a brighter overlaid head.
    expect(renderer.hasTrails()).toBe(true)

    trails.length = 0
    renderer.paint(0.2, 1, 0)
    expect(points.length).toBe(stars.length)
    for (let index = 0; index < stars.length; index++) {
      expect(trails[index].width).toBe(points[index].width)
      const headAlpha =
        trails[index].alpha + (1 - trails[index].alpha) * points[index].alpha
      expect(headAlpha).toBeCloseTo(stars[index].alpha)
    }
  })

  test("steady rotation composites one cached image without rebuilding arcs", () => {
    const { renderer, context, textureContext, texture } = createRenderer(
      1280,
      720
    )
    for (let step = 0; step <= 36; step++) renderer.paint(step / 4, 1, 1)
    textureContext.arc.mockClear()
    textureContext.clearRect.mockClear()
    context.drawImage.mockClear()
    const angle = context.rotate.mock.lastCall![0]
    for (let step = 1; step <= 60; step++) renderer.paint(9 + step / 60, 1, 1)
    expect(context.drawImage).toHaveBeenCalledTimes(60)
    expect(context.rotate.mock.lastCall![0]).toBeGreaterThan(angle)
    expect(textureContext.arc).not.toHaveBeenCalled()
    expect(textureContext.clearRect).not.toHaveBeenCalled()
    expect(texture.width).toBeLessThanOrEqual(2048)
    expect(texture.height).toBeLessThanOrEqual(2048)
  })

  test("the static state holds complete trails and reuses its cached image", () => {
    const { renderer, context, textureContext } = createRenderer()
    renderer.paintStatic(1)
    expect(renderer.hasTrails()).toBe(true)
    expect(textureContext.stroke).toHaveBeenCalled()
    const position = context.rotate.mock.lastCall![0]
    textureContext.arc.mockClear()
    for (let index = 0; index < 60; index++) renderer.paintStatic(1)
    expect(
      context.rotate.mock.calls.every(([angle]) => angle === position)
    ).toBe(true)
    expect(textureContext.arc).not.toHaveBeenCalled()
    expect(renderer.hasTrails()).toBe(true)
    renderer.paint(100, 1, 1)
    expect(context.rotate.mock.lastCall![0]).toBe(position)
    renderer.paint(100.1, 1, 1)
    expect(context.rotate.mock.lastCall![0]).toBeGreaterThan(position)
  })

  test("zero speed fades a formed still frame into stars at the same positions", () => {
    const { renderer, context, textureContext, surface } = createRenderer()
    renderer.paintStatic(1)
    const position = context.rotate.mock.lastCall![0]
    renderer.paint(100, 1, 0)
    expect(renderer.hasTrails()).toBe(true)
    for (let step = 1; step <= (STAR_TRAIL_EXPOSURE_SECONDS + 1) * 10; step++)
      renderer.paint(100 + step / 10, 1, 0)
    expect(renderer.hasTrails()).toBe(false)
    expect(
      context.rotate.mock.calls.every(([angle]) => angle === position)
    ).toBe(true)

    textureContext.stroke.mockClear()
    textureContext.arc.mockClear()
    textureContext.fill.mockClear()
    renderer.update({ ...surface, starColor: "#ccddee" })
    renderer.repaint(1)
    expect(textureContext.stroke).not.toHaveBeenCalled()
    expect(textureContext.fill).toHaveBeenCalled()
    expect(
      textureContext.arc.mock.calls.every(
        (call) => call[4] - call[3] === Math.PI * 2
      )
    ).toBe(true)
  })

  test("limits exposure rebuilding while the stars continue rotating every frame", () => {
    const { renderer, context, textureContext } = createRenderer()
    renderer.paint(0, 1, 1)
    textureContext.clearRect.mockClear()
    context.drawImage.mockClear()
    for (let step = 1; step <= 240; step++) renderer.paint(step / 120, 1, 1)
    expect(context.drawImage).toHaveBeenCalledTimes(240)
    expect(textureContext.clearRect.mock.calls.length).toBeLessThanOrEqual(42)
    expect(renderer.hasTrails()).toBe(true)
  })
})
