export type Bitmap = number[][]

const glyphs: Record<string, string> = {
  "0": "01110/10001/10011/10101/11001/10001/01110",
  "1": "00100/01100/00100/00100/00100/00100/01110",
  "2": "01110/10001/00001/00010/00100/01000/11111",
  "3": "11110/00001/00001/01110/00001/00001/11110",
  "4": "00010/00110/01010/10010/11111/00010/00010",
  "5": "11111/10000/10000/11110/00001/00001/11110",
  "6": "01110/10000/10000/11110/10001/10001/01110",
  "7": "11111/00001/00010/00100/01000/01000/01000",
  "8": "01110/10001/10001/01110/10001/10001/01110",
  "9": "01110/10001/10001/01111/00001/00001/01110",
  A: "01110/10001/10001/11111/10001/10001/10001",
  B: "11110/10001/10001/11110/10001/10001/11110",
  C: "01111/10000/10000/10000/10000/10000/01111",
  D: "11110/10001/10001/10001/10001/10001/11110",
  E: "11111/10000/10000/11110/10000/10000/11111",
  F: "11111/10000/10000/11110/10000/10000/10000",
  G: "01111/10000/10000/10111/10001/10001/01111",
  H: "10001/10001/10001/11111/10001/10001/10001",
  I: "01110/00100/00100/00100/00100/00100/01110",
  J: "00111/00010/00010/00010/00010/10010/01100",
  K: "10001/10010/10100/11000/10100/10010/10001",
  L: "10000/10000/10000/10000/10000/10000/11111",
  M: "10001/11011/10101/10101/10001/10001/10001",
  N: "10001/11001/10101/10011/10001/10001/10001",
  O: "01110/10001/10001/10001/10001/10001/01110",
  P: "11110/10001/10001/11110/10000/10000/10000",
  Q: "01110/10001/10001/10001/10101/10010/01101",
  R: "11110/10001/10001/11110/10100/10010/10001",
  S: "01111/10000/10000/01110/00001/00001/11110",
  T: "11111/00100/00100/00100/00100/00100/00100",
  U: "10001/10001/10001/10001/10001/10001/01110",
  V: "10001/10001/10001/10001/10001/01010/00100",
  W: "10001/10001/10001/10101/10101/10101/01010",
  X: "10001/10001/01010/00100/01010/10001/10001",
  Y: "10001/10001/01010/00100/00100/00100/00100",
  Z: "11111/00001/00010/00100/01000/10000/11111",
  ":": "0/1/1/0/1/1/0",
  ".": "0/0/0/0/0/1/1",
  "!": "1/1/1/1/1/0/1",
  "?": "01110/10001/00001/00010/00100/00000/00100",
  "-": "000/000/000/111/000/000/000",
  " ": "000/000/000/000/000/000/000",
}

export function decodeSprite(rows: string): Bitmap {
  return rows.split("/").map((row) => [...row].map(Number))
}

export function textBitmap(value: string): Bitmap {
  const text = value.replace(/[^\x20-\x7e]/g, "").toUpperCase()
  if ([...text].every((character) => character in glyphs)) {
    const rows: Bitmap = Array.from({ length: 7 }, () => [])
    for (const character of text) {
      const glyph = decodeSprite(glyphs[character])
      rows.forEach((row, index) => row.push(...glyph[index], 0))
    }
    return rows.map((row) => row.slice(0, -1))
  }

  // Rasterize remaining ASCII symbols and quantize each cell to on or off.
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d")
  if (!context) return textBitmap("?")
  context.font = "7px sans-serif"
  canvas.width = Math.max(1, Math.ceil(context.measureText(text).width) + 2)
  canvas.height = 7
  context.font = "7px sans-serif"
  context.textBaseline = "top"
  context.fillStyle = "#fff"
  context.fillText(text, 1, 0)
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  return Array.from({ length: canvas.height }, (_, y) =>
    Array.from({ length: canvas.width }, (_, x) =>
      pixels[(y * canvas.width + x) * 4 + 3] >= 100 ? 1 : 0
    )
  )
}

export function fitBitmap(bitmap: Bitmap, columns: number, offset = 0): Bitmap {
  const width = bitmap[0]?.length ?? 0
  if (width <= columns) {
    const left = Math.floor((columns - width) / 2)
    return bitmap.map((row) =>
      Array.from({ length: columns }, (_, x) => row[x - left] ?? 0)
    )
  }
  return bitmap.map((row) =>
    Array.from(
      { length: columns },
      (_, x) => row[(x + offset) % (width + 8)] ?? 0
    )
  )
}
