export const TAB_ICON_MAX_BYTES = 64 * 1024
const TAB_ICON_MAX_DATA_LENGTH = Math.ceil(TAB_ICON_MAX_BYTES / 3) * 4 + 64
const iconCharacterSegmenter = new Intl.Segmenter(undefined, {
  granularity: "grapheme",
})

export function isSingleIconCharacter(text: string): boolean {
  if (
    !/[\p{L}\p{N}\p{P}\p{S}]/u.test(text) ||
    /[\p{Cc}\p{Cs}\p{Z}]/u.test(text)
  )
    return false
  const characters = iconCharacterSegmenter.segment(text)[Symbol.iterator]()
  return !characters.next().done && !!characters.next().done
}

export async function createTextTabIcon(
  text: string,
  appearance: { backgroundColor: string; radius: number }
): Promise<string> {
  if (!isSingleIconCharacter(text)) throw new Error("tabIconCharacterInvalid")
  if (
    !/^#[0-9a-f]{6}$/i.test(appearance.backgroundColor) ||
    !Number.isFinite(appearance.radius) ||
    appearance.radius < 0 ||
    appearance.radius > 50
  )
    throw new Error("tabIconAppearanceInvalid")
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (!context) throw new Error("tabIconInvalid")
  context.beginPath()
  context.roundRect(0, 0, 128, 128, (128 * appearance.radius) / 100)
  context.clip()
  context.fillStyle = appearance.backgroundColor
  context.fillRect(0, 0, 128, 128)
  context.font = "bold 88px sans-serif"
  context.fillStyle = "#ffffff"
  context.textAlign = "center"
  const metrics = context.measureText(text)
  context.fillText(
    text,
    64,
    64 +
      (metrics.actualBoundingBoxAscent - metrics.actualBoundingBoxDescent) / 2,
    112
  )
  return encodeIconCanvas(canvas)
}

export type TabIconCropArea = { x: number; y: number; size: number }

export function squareTabIconCrop(
  image: { width: number; height: number },
  zoom: number,
  center: { x: number; y: number }
): TabIconCropArea {
  const size = Math.min(image.width, image.height) / Math.max(1, zoom)
  return {
    x: Math.max(0, Math.min(image.width - size, center.x - size / 2)),
    y: Math.max(0, Math.min(image.height - size, center.y - size / 2)),
    size,
  }
}

export function validTabIcon(value: unknown): value is string | undefined {
  if (value === undefined) return true
  if (typeof value !== "string" || value.length > TAB_ICON_MAX_DATA_LENGTH)
    return false
  const match = /^data:image\/webp;base64,([A-Za-z0-9+/]+={0,2})$/.exec(value)
  if (!match || match[1].length % 4 !== 0) return false
  try {
    const data = atob(match[1])
    return (
      data.length <= TAB_ICON_MAX_BYTES &&
      data.startsWith("RIFF") &&
      data.slice(8, 12) === "WEBP"
    )
  } catch {
    return false
  }
}

export async function readTabIcon(file: File): Promise<ImageBitmap> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size === 0 ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error("tabIconInvalid")
  const bitmap = await createImageBitmap(file)
  if (!bitmap.width || !bitmap.height) {
    bitmap.close()
    throw new Error("tabIconInvalid")
  }
  return bitmap
}

export async function encodeTabIcon(
  bitmap: ImageBitmap,
  crop: TabIconCropArea
): Promise<string> {
  const canvas = document.createElement("canvas")
  canvas.width = 128
  canvas.height = 128
  const context = canvas.getContext("2d")
  if (!context) throw new Error("tabIconInvalid")
  context.drawImage(
    bitmap,
    crop.x,
    crop.y,
    crop.size,
    crop.size,
    0,
    0,
    128,
    128
  )
  return encodeIconCanvas(canvas)
}

async function encodeIconCanvas(canvas: HTMLCanvasElement): Promise<string> {
  for (const quality of [0.9, 0.75, 0.55]) {
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality)
    )
    if (!blob || blob.size > TAB_ICON_MAX_BYTES) continue
    const value = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => resolve(String(reader.result))
      reader.onerror = () => reject(new Error("tabIconInvalid"))
      reader.readAsDataURL(blob)
    })
    if (validTabIcon(value)) return value
  }
  throw new Error("tabIconInvalid")
}
