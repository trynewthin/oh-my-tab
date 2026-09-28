import { describe, expect, test } from "vitest"
import { textBitmap } from "@/components/dot-matrix/bitmap-font"
import {
  clockBitmap,
  framedClockBitmap,
} from "@/components/dot-matrix/responsive-layout"

describe("clock matrix frame", () => {
  test("surrounds a horizontal clock with exactly one unlit row and column", () => {
    const glyph = textBitmap("19:08")
    const pixels = framedClockBitmap("19:08")
    expect(pixels.length).toBe(glyph.length + 2)
    expect(pixels[0].length).toBe(glyph[0].length + 2)
    expect(pixels[0].every((value) => value === 0)).toBe(true)
    expect(pixels.at(-1)?.every((value) => value === 0)).toBe(true)
    expect(pixels.every((row) => row[0] === 0 && row.at(-1) === 0)).toBe(true)
    expect(pixels.slice(1, -1).map((row) => row.slice(1, -1))).toEqual(glyph)
  })

  test("stacks hours and minutes in one continuous matrix with a shared separator", () => {
    const pixels = framedClockBitmap("19:08", true)
    const compact = clockBitmap("19:08", 7, false).pixels
    expect(pixels).toHaveLength(19)
    expect(new Set(pixels.map((row) => row.length))).toEqual(new Set([9]))
    expect(pixels.slice(8, 11)).toEqual(
      Array.from({ length: 3 }, () => Array(9).fill(0))
    )
    expect(pixels.slice(1, 8).map((row) => row.slice(1, -1))).toEqual(
      compact.slice(0, 7)
    )
    expect(pixels.slice(11, 18).map((row) => row.slice(1, -1))).toEqual(
      compact.slice(8, 15)
    )
    expect(pixels.length / pixels[0].length).toBeGreaterThan(2)
  })
})
