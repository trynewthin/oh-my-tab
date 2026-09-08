export const DOT_COLUMNS = 24
export const DOT_ROWS = 24
export const blankDots = (columns = DOT_COLUMNS, rows = DOT_ROWS) =>
  Array<string>(columns * rows).fill("")
export const dotDimensions = (pixels: string[], pixelColumns?: number) =>
  pixelColumns
    ? { columns: pixelColumns, rows: pixels.length / pixelColumns }
    : pixels.length === 1024
      ? { columns: 32, rows: 32 }
      : { columns: DOT_COLUMNS, rows: DOT_ROWS }

export function displayDots(pixels: string[]) {
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
  return result
}

export function isDotVisible(index: number, columns: number, rows: number) {
  const x = index % columns
  const y = Math.floor(index / columns)
  const edgeX = Math.min(x, columns - 1 - x)
  const edgeY = Math.min(y, rows - 1 - y)
  return edgeX !== 0 || edgeY !== 0
}

export function canvasDimensions(size: string) {
  return {
    columns: size === "wide" || size === "wide-tall" ? 48 : 24,
    rows: size === "tall" || size === "wide-tall" ? 48 : 24,
  }
}
export function resizeDots(
  pixels: string[],
  sourceColumns: number,
  columns: number,
  rows: number
) {
  const result = blankDots(columns, rows)
  for (let y = 0; y < Math.min(rows, pixels.length / sourceColumns); y++)
    for (let x = 0; x < Math.min(columns, sourceColumns); x++)
      result[y * columns + x] = pixels[y * sourceColumns + x]
  return result
}
