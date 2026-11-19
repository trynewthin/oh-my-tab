import { useEffect, useId, useState, type RefObject } from "react"
import { createGlassDisplacementMap } from "@/lib/liquid-glass-refraction"

export type DisplacementImage = {
  width: number
  height: number
  radius: number
  href: string
}

export function useGlassDisplacement(
  surfaceRef: RefObject<HTMLDivElement | null>,
  enabled: boolean,
  rimWidth: number
) {
  const id = useId()
  const [image, setImage] = useState<DisplacementImage>()

  useEffect(() => {
    const surface = surfaceRef.current
    if (
      !enabled ||
      !surface ||
      !CSS.supports("backdrop-filter", 'url("#glass")')
    )
      return

    const canvas = document.createElement("canvas")
    const context = canvas.getContext("2d")
    if (!context) return

    let previous: DisplacementImage | undefined
    const observer = new ResizeObserver(() => {
      const { clientWidth: width, clientHeight: height } = surface
      if (!width || !height) return
      const radius =
        Number.parseFloat(getComputedStyle(surface).borderTopLeftRadius) || 0
      if (
        previous?.width === width &&
        previous.height === height &&
        previous.radius === radius
      )
        return

      const { pixels, columns, rows } = createGlassDisplacementMap({
        width,
        height,
        radius,
        rimWidth,
      })
      canvas.width = columns
      canvas.height = rows
      context.putImageData(new ImageData(pixels, columns, rows), 0, 0)
      previous = { width, height, radius, href: canvas.toDataURL() }
      setImage(previous)
    })

    observer.observe(surface)
    return () => observer.disconnect()
  }, [enabled, rimWidth, surfaceRef])

  return { id, image: enabled ? image : undefined }
}
