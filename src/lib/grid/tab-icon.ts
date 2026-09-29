export const TAB_ICON_MAX_BYTES = 64 * 1024
const TAB_ICON_MAX_DATA_LENGTH = Math.ceil(TAB_ICON_MAX_BYTES / 3) * 4 + 64

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

export async function prepareTabIcon(file: File): Promise<string> {
  if (
    !["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    file.size === 0 ||
    file.size > 2 * 1024 * 1024
  )
    throw new Error("tabIconInvalid")
  const bitmap = await createImageBitmap(file)
  try {
    if (!bitmap.width || !bitmap.height) throw new Error("tabIconInvalid")
    const canvas = document.createElement("canvas")
    canvas.width = 128
    canvas.height = 128
    const context = canvas.getContext("2d")
    if (!context) throw new Error("tabIconInvalid")
    const scale = Math.min(128 / bitmap.width, 128 / bitmap.height)
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    context.drawImage(
      bitmap,
      Math.round((128 - width) / 2),
      Math.round((128 - height) / 2),
      width,
      height
    )
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
  } finally {
    bitmap.close()
  }
}
