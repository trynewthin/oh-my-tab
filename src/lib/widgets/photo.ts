import { PHOTO_MAX_BYTES, validPhoto } from "./model"

/** Rasterize locally; never retain file paths, metadata, SVG, or remote URLs. */
export async function prepareWidgetPhoto(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size > 5 * 1024 * 1024 ||
    file.size === 0
  )
    throw new Error("photoInvalid")

  const bitmap = await createImageBitmap(file)
  try {
    const scale = Math.min(1, 1024 / Math.max(bitmap.width, bitmap.height))
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(bitmap.width * scale))
    canvas.height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("photoInvalid")
    context.drawImage(bitmap, 0, 0, canvas.width, canvas.height)

    for (const quality of [0.82, 0.65, 0.45]) {
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/webp", quality)
      )
      if (!blob || blob.size > PHOTO_MAX_BYTES) continue
      const result = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = () => reject(new Error("photoInvalid"))
        reader.readAsDataURL(blob)
      })
      if (validPhoto(result)) return result
    }
    throw new Error("photoInvalid")
  } finally {
    bitmap.close()
  }
}
