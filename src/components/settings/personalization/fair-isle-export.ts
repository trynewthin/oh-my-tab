import {
  createFairIsleTexture,
  fairIsleTileGeometry,
  FAIR_ISLE_ROW_RATIO,
  type FairIsleTexture,
} from "@/lib/fair-isle"
import type { FairIsleSettings } from "@/lib/fair-isle-settings"

type PreviewFrame = {
  width: number
  height: number
  offset: { x: number; y: number }
  fit: boolean
}

export type FairIsleExportFormat = "preview" | "tile" | "svg"

export async function exportFairIsle(
  settings: FairIsleSettings,
  texture: FairIsleTexture,
  format: FairIsleExportFormat,
  size: number,
  preview: PreviewFrame
) {
  let blob: Blob
  if (format === "svg") {
    const chart = createFairIsleTexture({ ...settings, mode: "chart" }, 1)
    const svg = chart.svg.replace(
      "<svg ",
      `<svg width="${chart.columns * 12}" height="${chart.rows * 12}" `
    )
    blob = new Blob([svg], { type: "image/svg+xml" })
  } else {
    const tile = fairIsleTileGeometry(texture, settings.stitchSize)
    const isTile = format === "tile"
    const frame = isTile ? tile : preview
    const scale = size / Math.max(frame.width, frame.height)
    const canvas = document.createElement("canvas")
    canvas.width = Math.max(1, Math.round(frame.width * scale))
    canvas.height = Math.max(1, Math.round(frame.height * scale))
    const context = canvas.getContext("2d")
    if (!context) throw new Error("Canvas is unavailable")
    const tileWidth = tile.width * scale
    const tileHeight = tile.height * scale
    const imageScale = Math.min(1, size / Math.max(tileWidth, tileHeight))
    const imageWidth = isTile
      ? canvas.width
      : Math.max(1, Math.round(tileWidth * imageScale))
    const imageHeight = isTile
      ? canvas.height
      : Math.max(1, Math.round(tileHeight * imageScale))
    const image = new Image()
    const sizedSvg = texture.svg.replace(
      "<svg ",
      `<svg width="${imageWidth}" height="${imageHeight}" `
    )
    image.src = `data:image/svg+xml,${encodeURIComponent(sizedSvg)}`
    await image.decode()
    if (isTile) {
      context.drawImage(image, 0, 0, canvas.width, canvas.height)
    } else if (preview.fit) {
      const aspect = texture.columns / (texture.rows * FAIR_ISLE_ROW_RATIO)
      const width = Math.min(canvas.width, canvas.height * aspect)
      const height = width / aspect
      context.drawImage(
        image,
        (canvas.width - width) / 2,
        (canvas.height - height) / 2,
        width,
        height
      )
    } else {
      const pattern = context.createPattern(image, "repeat")
      if (!pattern) throw new Error("The repeat tile could not be painted")
      const left = (canvas.width - tileWidth) / 2 + preview.offset.x * scale
      const top = (tile.top + preview.offset.y) * scale
      pattern.setTransform(
        new DOMMatrix()
          .translate(left, top)
          .scale(tileWidth / imageWidth, tileHeight / imageHeight)
      )
      context.fillStyle = pattern
      context.fillRect(0, 0, canvas.width, canvas.height)
    }
    blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((value) =>
        value ? resolve(value) : reject(new Error("PNG encoding failed"))
      )
    })
  }
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  const seed = settings.seed.replace(/[^\p{L}\p{N}_-]/gu, "_")
  link.download = `fair-isle-${seed}-${format}.${format === "svg" ? "svg" : "png"}`
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 60000)
}
