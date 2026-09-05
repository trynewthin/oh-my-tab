import type { Bitmap } from "./bitmap-font"

export function oceanCellColor(value: number, color = "#3478f6"): string {
  if (value <= 0) return "var(--muted)"
  const tint = Math.min(1, value) * 45
  return `color-mix(in srgb, ${color} ${tint}%, var(--muted))`
}

function hash(x: number, y: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

function waterNoise(x: number, y: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = x - ix
  const fy = y - iy
  const sx = fx * fx * (3 - 2 * fx)
  const sy = fy * fy * (3 - 2 * fy)
  const top = hash(ix, iy) * (1 - sx) + hash(ix + 1, iy) * sx
  const bottom = hash(ix, iy + 1) * (1 - sx) + hash(ix + 1, iy + 1) * sx
  return top * (1 - sy) + bottom * sy
}

export function breathingWave(
  columns: number,
  rows: number,
  frame: number
): Bitmap {
  const time = frame * 0.16
  const breath = (1 - Math.cos((time * Math.PI * 2) / 10)) / 2

  return Array.from({ length: rows }, (_, y) =>
    Array.from({ length: columns }, (_, x) => {
      // Advected two-dimensional fields describe the ocean surface from above.
      const u = x * 0.18
      const v = y * 0.22
      const currentX = waterNoise(u * 0.6 + time * 0.035, v * 0.6 + 12) - 0.5
      const currentY = waterNoise(u * 0.6 + 37, v * 0.6 - time * 0.025) - 0.5
      const surface = waterNoise(
        u + currentX - time * 0.06,
        v + currentY + time * 0.045
      )
      const detail = waterNoise(
        u * 2.2 + time * 0.075 + currentY,
        v * 2.2 - time * 0.06 + currentX
      )
      const light = surface * 0.75 + detail * 0.25
      const threshold = 0.5 - breath * 0.07
      if (light <= threshold) return 0
      const strength = Math.min(1, (light - threshold) / (0.9 - threshold))
      return strength * strength * (3 - 2 * strength)
    })
  )
}
