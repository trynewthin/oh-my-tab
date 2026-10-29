import { describe, expect, it } from "vitest"
import {
  burningCell,
  createBurningTexture,
} from "@/components/effects/burning-texture"
import {
  particleCell,
  createParticleCell,
} from "@/components/effects/particle-texture"

const frames: [number | undefined, number, number][] = [
  [undefined, 1, 1],
  [0, 1, 1],
  [2.5, 1, 1],
  [2.5, 0.4, 1],
  [2.5, 0.4, 2],
  [2.5, 0, 2],
  [40, 1, 2],
  [40, 1, 0],
  [undefined, 1, 1],
  [0.2, 1, 1],
]

describe("effect textures", () => {
  it("burning rows remain correct across time, reveal, amplitude and row changes", () => {
    for (const columns of [1, 19, 37]) {
      const paint = createBurningTexture("#3478f6", 183477, columns)
      for (const [time, visibility, amplitude] of frames) {
        for (const y of [0, 1, 7, 23, 0]) {
          for (let x = 0; x < columns; x++) {
            expect(paint(x, y, time, visibility, amplitude)).toBe(
              burningCell(
                "#3478f6",
                183477,
                x,
                y,
                columns,
                time,
                visibility,
                amplitude
              )
            )
          }
        }
      }
    }
  })

  it("prepared particles preserve pointer, reduced motion and reveal states", () => {
    for (let y = 0; y < 14; y++) {
      for (let x = 0; x < 19; x++) {
        const paint = createParticleCell("#eb9970", 739281, x, y, 19)
        for (const [time, visibility, amplitude] of frames) {
          for (const pointer of [
            null,
            { x: x * 9 + 4, y: y * 9 + 4 },
            { x: 160, y: 100 },
          ]) {
            expect(paint(time, visibility, amplitude, pointer)).toEqual(
              particleCell(
                "#eb9970",
                739281,
                x,
                y,
                19,
                time,
                visibility,
                amplitude,
                pointer
              )
            )
          }
        }
      }
    }
  })

  it("full coverage reaches every cell in static and animated frames while hidden surfaces stay hidden", () => {
    for (const columns of [1, 19, 37]) {
      for (const seed of [1, 183477, 739281]) {
        const paint = createBurningTexture("#3478f6", seed, columns, 1)
        for (let y = 0; y < 24; y++)
          for (let x = 0; x < columns; x++) {
            const particle = createParticleCell(
              "#3478f6",
              seed,
              x,
              y,
              columns,
              1
            )
            for (const time of [undefined, 0, 2.5, 40])
              for (const amplitude of [0, 1, 2]) {
                expect(paint(x, y, time, 1, amplitude)).not.toBe("transparent")
                expect(
                  particle(time, 1, amplitude, null).backgroundColor
                ).not.toBe("transparent")
                expect(paint(x, y, time, 0, amplitude)).toBe("transparent")
                expect(particle(time, 0, amplitude, null).backgroundColor).toBe(
                  "transparent"
                )
              }
          }
      }
    }
  })

  it("increasing coverage removes the transparent edge progressively", () => {
    const counts = [0, 0.5, 1].map((fill) => {
      const paint = createBurningTexture("#3478f6", 183477, 37, fill)
      let count = 0
      for (let y = 0; y < 24; y++)
        for (let x = 0; x < 37; x++) {
          if (paint(x, y, undefined, 1, 1) !== "transparent") count++
        }
      return count
    })
    expect(counts[0]).toBeLessThan(counts[1])
    expect(counts[1]).toBeLessThan(counts[2])
    expect(counts[2]).toBe(37 * 24)
  })
})
