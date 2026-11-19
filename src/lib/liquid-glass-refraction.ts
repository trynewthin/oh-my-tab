type GlassGeometry = {
  width: number
  height: number
  radius: number
  rimWidth: number
}

export function createGlassDisplacementMap({
  width,
  height,
  radius,
  rimWidth,
}: GlassGeometry) {
  const shortestSide = Math.min(width, height)
  const corner = Math.min(shortestSide / 2, Math.max(0, radius))
  const bevel = Math.min(36, shortestSide * 0.48) * (rimWidth / 100)
  const resolution = Math.min(1, 256 / Math.max(width, height))
  const columns = Math.max(1, Math.round(width * resolution))
  const rows = Math.max(1, Math.round(height * resolution))
  const pixels = new Uint8ClampedArray(columns * rows * 4)

  for (let row = 0; row < rows; row++) {
    const y = ((row + 0.5) / rows - 0.5) * height
    for (let column = 0; column < columns; column++) {
      const x = ((column + 0.5) / columns - 0.5) * width
      // The signed distance follows both the straight edges and the rounded corners.
      const qx = Math.abs(x) - (width / 2 - corner)
      const qy = Math.abs(y) - (height / 2 - corner)
      const dx = Math.max(qx, 0)
      const dy = Math.max(qy, 0)
      const length = Math.hypot(dx, dy)
      const distance = length + Math.min(Math.max(qx, qy), 0) - corner
      const edge = Math.max(0, Math.min(1, 1 + distance / bevel))
      const blend = edge * edge * (3 - 2 * edge)
      const normalX = length > 0 ? dx / length : Number(qx > qy)
      const normalY = length > 0 ? dy / length : Number(qy >= qx)
      const offset = (row * columns + column) * 4
      // Red and green displace the backdrop inward. Blue blends in the refracted rim.
      pixels[offset] = 128 - 127 * Math.sign(x) * normalX * blend
      pixels[offset + 1] = 128 - 127 * Math.sign(y) * normalY * blend
      pixels[offset + 2] = 255 * blend
      pixels[offset + 3] = 255
    }
  }
  return { pixels, columns, rows }
}
