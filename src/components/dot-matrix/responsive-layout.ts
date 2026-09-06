import { decodeSprite, fitBitmap, textBitmap, type Bitmap } from "./bitmap-font"

export const CELL_SIZE = 12
export const CELL_GAP = 3
export function matrixColumns(width: number) {
  return Math.max(1, Math.floor((width + CELL_GAP) / (CELL_SIZE + CELL_GAP)))
}
const compactDigits: Record<string, string> = {
  "0": "111/101/101/101/101/101/111",
  "1": "010/110/010/010/010/010/111",
  "2": "111/001/001/111/100/100/111",
  "3": "111/001/001/111/001/001/111",
  "4": "101/101/101/111/001/001/001",
  "5": "111/100/100/111/001/001/111",
  "6": "111/100/100/111/101/101/111",
  "7": "111/001/001/010/010/010/010",
  "8": "111/101/101/111/101/101/111",
  "9": "111/101/101/111/001/001/111",
  ":": "0/1/1/0/1/1/0",
}
function compactTime(value: string): Bitmap {
  const result: Bitmap = Array.from({ length: 7 }, () => [])
  for (const char of value) {
    const glyph = decodeSprite(compactDigits[char])
    result.forEach((row, i) => row.push(...glyph[i], 0))
  }
  return result.map((row) => row.slice(0, -1))
}
export function clockBitmap(time: string, columns: number) {
  const full = textBitmap(time)
  if (full[0].length <= columns)
    return { pixels: fitBitmap(full, columns), format: "seconds" }
  const minutes = time.slice(0, 5)
  const regular = textBitmap(minutes)
  if (regular[0].length <= columns)
    return { pixels: fitBitmap(regular, columns), format: "minutes" }
  const compact = compactTime(minutes)
  if (compact[0].length <= columns)
    return { pixels: fitBitmap(compact, columns), format: "compact" }
  return {
    pixels: [
      ...fitBitmap(compactTime(time.slice(0, 2)), columns),
      Array(columns).fill(0),
      ...fitBitmap(compactTime(time.slice(3, 5)), columns),
    ],
    format: "stacked",
  }
}
