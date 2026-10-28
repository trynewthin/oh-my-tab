export const DOT_COLUMNS = 24
export const DOT_ROWS = 24
export const blankDots = (columns = DOT_COLUMNS, rows = DOT_ROWS) =>
  Array<string>(columns * rows).fill("")
export const dotDimensions = (pixels: string[], pixelColumns: number) => ({
  columns: pixelColumns,
  rows: pixels.length / pixelColumns,
})

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
