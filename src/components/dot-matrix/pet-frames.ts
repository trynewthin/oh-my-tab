import { decodeSprite, type Bitmap } from "./bitmap-font"
import type { MatrixPet } from "@/stores/home-settings-store"

const cat = [
  "0100010000/0111110000/0101010000/0011100001/0111111110/0111111100/0100001000",
  "0100010000/0111110000/0101010000/0011100000/0111111111/0111111100/0010010000",
]
const dog = [
  "0111000000/1101100000/1101110001/0111100010/0011111110/0011111100/0010001000",
  "0111000000/1101100000/1101110000/0111100001/0011111110/0011111100/0001010000",
]

export function petBitmap(
  pet: MatrixPet,
  columns: number,
  frame: number
): Bitmap {
  const sprite = decodeSprite((pet === "cat" ? cat : dog)[frame % 2])
  const span = columns - sprite[0].length
  const step = Math.floor(frame / 3) % (span * 2)
  const goingRight = step <= span
  const left = goingRight ? step : span * 2 - step
  return sprite.map((row) => {
    const pixels = goingRight ? row : [...row].reverse()
    return Array.from({ length: columns }, (_, x) => pixels[x - left] ?? 0)
  })
}
