import { decodeSprite, type Bitmap } from "./bitmap-font"
import type { MatrixPet } from "./pet-catalog"

const glyphs: Record<string, string> = {
  "(": "01/10/10/10/01",
  ")": "10/01/01/01/10",
  "^": "000/010/101/000/000",
  "-": "000/000/111/000/000",
  ω: "000/000/101/111/010",
  o: "000/010/101/010/000",
  "•": "000/010/111/010/000",
  ᴥ: "000/101/010/101/010",
  "◕": "000/011/011/000/000",
  "◔": "000/110/110/000/000",
  ᗜ: "000/111/101/111/000",
  ᴗ: "000/000/101/010/000",
  ">": "100/010/001/010/100",
  "<": "001/010/100/010/001",
  "~": "000/000/010/101/000",
  z: "111/001/010/100/111",
  "/": "001/001/010/100/100",
  "\\": "100/100/010/001/001",
}
function faceBitmap(text: string): Bitmap {
  const rows: Bitmap = Array.from({ length: 5 }, () => [])
  for (const char of text) {
    const glyph = decodeSprite(glyphs[char])
    rows.forEach((row, i) => row.push(...glyph[i], 0))
  }
  return rows.map((row) => row.slice(0, -1))
}

export function petBitmap(
  pet: MatrixPet,
  columns: number,
  frame: number
): Bitmap {
  const phase = frame % 32
  let face: string
  let y = 1
  let accessory = ""
  switch (pet) {
    case "cat":
      face =
        phase === 12 || phase === 13
          ? "(-ω-)"
          : phase >= 24 && phase < 28
            ? "(^o^)"
            : "(^ω^)"
      break
    case "dog":
      face =
        phase >= 22 && phase < 28
          ? "(•ᗜ•)"
          : phase >= 8 && phase < 13
            ? "(◕ᴥ◕)"
            : phase >= 15 && phase < 20
              ? "(◔ᴥ◔)"
              : "(•ᴥ•)"
      break
    case "happy":
      face = phase >= 8 && phase < 24 ? "(>ᴗ<)" : "(^ᴗ^)"
      y = phase >= 8 && phase < 24 ? [1, 0, 1, 2][Math.floor(phase / 2) % 4] : 1
      if (phase >= 8 && phase < 24) accessory = "/"
      break
    case "sleepy":
      face = phase >= 26 && phase < 29 ? "(-o-)" : "(-ω-)"
      y = phase >= 14 && phase < 26 ? 2 : 1
      if (phase >= 8 && phase < 26) accessory = "z"
      break
  }
  const bitmap = faceBitmap(face)
  const width = bitmap[0].length
  const left = Math.max(0, Math.floor((columns - width) / 2))
  const result = Array.from({ length: 7 }, () => Array<number>(columns).fill(0))
  const paint = (pixels: Bitmap, offsetX: number, offsetY: number) => {
    pixels.forEach((row, iy) =>
      row.forEach((value, ix) => {
        if (offsetX + ix >= 0 && offsetX + ix < columns && offsetY + iy < 7)
          result[offsetY + iy][offsetX + ix] = value
      })
    )
  }
  paint(bitmap, left, y)
  if (accessory && columns >= width + 8) {
    paint(faceBitmap(accessory), left + width + 1, accessory === "z" ? 0 : y)
    if (accessory === "/") paint(faceBitmap("\\"), left - 4, y)
  }
  return result
}
