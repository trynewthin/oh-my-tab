import { blankDots, DOT_COLUMNS, DOT_ROWS } from "@/lib/grid/dot-canvas-data"

function migratePixels(pixels: string[]) {
  if ([576, 1152, 2304].includes(pixels.length)) return pixels
  const result = blankDots()
  if (pixels.length === 384) {
    // Keep rectangular artwork intact and centered in the square canvas.
    pixels.forEach((color, index) => {
      result[index + 4 * DOT_COLUMNS] = color
    })
  } else if (pixels.length === 1024) {
    for (let y = 0; y < DOT_ROWS; y++) {
      for (let x = 0; x < DOT_COLUMNS; x++) {
        const sourceX = Math.floor(((x + 0.5) * 32) / DOT_COLUMNS)
        const sourceY = Math.floor(((y + 0.5) * 32) / DOT_ROWS)
        result[y * DOT_COLUMNS + x] = pixels[sourceY * 32 + sourceX]
      }
    }
  }
  return [384, 1024].includes(pixels.length) ? result : pixels
}

export function migrateDotCanvas(item: Record<string, unknown>) {
  if (!Array.isArray(item.pixels)) return
  item.pixels = migratePixels(item.pixels)
  item.pixelColumns ??= DOT_COLUMNS
}
