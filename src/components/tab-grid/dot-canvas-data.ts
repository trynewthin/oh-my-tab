export const DOT_COLUMNS = 24
export const DOT_ROWS = 24
export const blankDots = (columns = DOT_COLUMNS, rows = DOT_ROWS) =>
  Array<string>(columns * rows).fill("")
export const dotDimensions = (pixels: string[]) =>
  pixels.length === 1024
    ? { columns: 32, rows: 32 }
    : { columns: DOT_COLUMNS, rows: DOT_ROWS }

export function displayDots(pixels: string[]) {
  if (pixels.length === DOT_COLUMNS * DOT_ROWS) return pixels
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
  return result
}

export function isDotVisible(index: number, columns: number, rows: number) {
  const x = index % columns
  const y = Math.floor(index / columns)
  const edgeX = Math.min(x, columns - 1 - x)
  const edgeY = Math.min(y, rows - 1 - y)
  return edgeX !== 0 || edgeY !== 0
}
