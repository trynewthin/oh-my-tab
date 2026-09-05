import { deflateSync } from "node:zlib"
import { mkdirSync, writeFileSync } from "node:fs"
function crc32(buffer) {
  let crc = 0xffffffff
  for (const byte of buffer) {
    crc ^= byte
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0)
  }
  return (crc ^ 0xffffffff) >>> 0
}
function chunk(type, data) {
  const body = Buffer.concat([Buffer.from(type), data])
  const length = Buffer.alloc(4)
  length.writeUInt32BE(data.length)
  const crc = Buffer.alloc(4)
  crc.writeUInt32BE(crc32(body))
  return Buffer.concat([length, body, crc])
}
function roundedRect(x, y, left, top, width, radius) {
  if (x < left || x > left + width || y < top || y > top + width) return false
  const dx = Math.max(left + radius - x, 0, x - (left + width - radius))
  const dy = Math.max(top + radius - y, 0, y - (top + width - radius))
  return dx * dx + dy * dy <= radius * radius
}
mkdirSync("public/icons", { recursive: true })
for (const size of [16, 48, 128]) {
  const raw = Buffer.alloc(size * (size * 4 + 1))
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const pixel = [0, 0, 0, 0]
      for (let sy = 0; sy < 4; sy++)
        for (let sx = 0; sx < 4; sx++) {
          const px = ((x + (sx + 0.5) / 4) * 64) / size
          const py = ((y + (sy + 0.5) / 4) * 64) / size
          if (!roundedRect(px, py, 0, 0, 64, 19)) continue
          const isTile = [15, 35].some((left) =>
            [15, 35].some((top) => roundedRect(px, py, left, top, 14, 3))
          )
          const color = isTile ? [238, 242, 232] : [38, 58, 44]
          for (let i = 0; i < 3; i++) pixel[i] += color[i]
          pixel[3] += 255
        }
      const offset = y * (size * 4 + 1) + 1 + x * 4
      for (let i = 0; i < 3; i++)
        raw[offset + i] = pixel[3] ? Math.round(pixel[i] / (pixel[3] / 255)) : 0
      raw[offset + 3] = Math.round(pixel[3] / 16)
    }
  const header = Buffer.alloc(13)
  header.writeUInt32BE(size)
  header.writeUInt32BE(size, 4)
  header[8] = 8
  header[9] = 6
  writeFileSync(
    `public/icons/icon-${size}.png`,
    Buffer.concat([
      Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
      chunk("IHDR", header),
      chunk("IDAT", deflateSync(raw)),
      chunk("IEND", Buffer.alloc(0)),
    ])
  )
}
