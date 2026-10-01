export type PreviewBox = { width: number; height: number }

/** Fit the whole real widget into its stage, without cropping or upscaling. */
export function fitPreview(
  content: PreviewBox,
  stage: PreviewBox,
  maximumScale = 1
) {
  const values = [
    content.width,
    content.height,
    stage.width,
    stage.height,
    maximumScale,
  ]
  if (values.some((value) => !Number.isFinite(value) || value <= 0))
    return { width: 0, height: 0, scale: 0 }

  const scale = Math.min(
    1,
    maximumScale,
    stage.width / content.width,
    stage.height / content.height
  )
  return {
    width: content.width * scale,
    height: content.height * scale,
    scale,
  }
}
