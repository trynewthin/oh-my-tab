import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"
import { subscribeBurningFrame } from "@/components/effects/burning-clock"

let frameId = 0
let frames: Map<number, FrameRequestCallback>
let media: EventTarget & { matches: boolean }
let page: EventTarget & { hidden: boolean }
let cleanup: (() => void)[]

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "performance"] })
  frameId = 0
  frames = new Map()
  cleanup = []
  media = Object.assign(new EventTarget(), { matches: false })
  page = Object.assign(new EventTarget(), { hidden: false })
  vi.stubGlobal(
    "window",
    Object.assign(new EventTarget(), { matchMedia: () => media })
  )
  vi.stubGlobal("document", page)
  vi.stubGlobal(
    "requestAnimationFrame",
    vi.fn((callback: FrameRequestCallback) => {
      const id = ++frameId
      frames.set(id, callback)
      return id
    })
  )
  vi.stubGlobal(
    "cancelAnimationFrame",
    vi.fn((id: number) => frames.delete(id))
  )
})

afterEach(() => {
  cleanup.forEach((stop) => stop())
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function nextFrame() {
  vi.advanceTimersByTime(1000 / 60)
  const pending = [...frames]
  for (const [id, callback] of pending) {
    if (frames.delete(id)) callback(performance.now())
  }
}

describe("shared effect clock", () => {
  test("keeps smooth motion running during inactivity while throttling other effects", () => {
    const regular = vi.fn()
    const smooth = vi.fn()
    cleanup.push(subscribeBurningFrame(regular))
    const stopSmooth = subscribeBurningFrame(smooth, undefined, {
      smooth: true,
    })
    cleanup.push(stopSmooth)
    for (let index = 0; index < 240; index++) nextFrame()
    expect(smooth).toHaveBeenCalledTimes(241)
    expect(regular.mock.calls.length).toBeLessThan(80)
    expect(regular.mock.calls.length).toBeGreaterThan(40)

    stopSmooth()
    expect(frames.size).toBe(0)
    const previous = regular.mock.calls.length
    vi.advanceTimersByTime(500)
    expect(regular.mock.calls.length - previous).toBe(4)
    expect(smooth).toHaveBeenCalledTimes(241)
  })

  test("pauses hidden and reduced-motion frames and resumes the shared loop", () => {
    const paint = vi.fn()
    cleanup.push(subscribeBurningFrame(paint, undefined, { smooth: true }))
    nextFrame()
    page.hidden = true
    page.dispatchEvent(new Event("visibilitychange"))
    expect(frames.size).toBe(0)
    const count = paint.mock.calls.length
    vi.advanceTimersByTime(1000)
    expect(paint).toHaveBeenCalledTimes(count)

    page.hidden = false
    page.dispatchEvent(new Event("visibilitychange"))
    expect(frames.size).toBe(1)
    media.matches = true
    media.dispatchEvent(new Event("change"))
    expect(paint.mock.lastCall).toEqual([undefined])
    expect(frames.size).toBe(0)
    media.matches = false
    media.dispatchEvent(new Event("change"))
    expect(typeof paint.mock.lastCall![0]).toBe("number")
    expect(frames.size).toBe(1)
  })

  test("does not schedule another frame when the last subscriber finishes inside paint", () => {
    let finish = false
    const paint = vi.fn(() => {
      if (finish) stop()
    })
    const stop = subscribeBurningFrame(paint, undefined, { smooth: true })
    cleanup.push(stop)
    finish = true
    nextFrame()
    expect(paint).toHaveBeenCalledTimes(2)
    expect(frames.size).toBe(0)
    expect(vi.getTimerCount()).toBe(0)
  })
})
