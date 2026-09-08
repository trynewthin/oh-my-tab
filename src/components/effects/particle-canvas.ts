import { createParticleCell } from "./particle-texture"

export function createParticleCanvas(
  region: HTMLElement,
  color: string,
  seed: number,
  columns: number,
  rows: number,
  offsetY: number,
  size: { width: number; height: number }
) {
  const canvas = document.createElement("canvas")
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null
  const scale = window.devicePixelRatio || 1
  canvas.width = Math.ceil(size.width * scale)
  canvas.height = Math.ceil(size.height * scale)
  canvas.style.cssText = `position:absolute;inset:0;width:${size.width}px;height:${size.height}px`
  canvas.setAttribute("aria-hidden", "true")
  canvas.dataset.particleCanvas = ""
  const grid = region.firstElementChild as HTMLElement
  const previousVisibility = grid.style.visibility
  const firstRow = Math.floor(offsetY / 9)
  const shiftY = offsetY % 9
  const left = size.width - (columns * 9 - 1)
  const particles = Array.from({ length: columns * rows }, (_, index) => {
    const x = index % columns
    const y = Math.floor(index / columns)
    return {
      x,
      y,
      sample: createParticleCell(color, seed, x, firstRow + y, columns),
    }
  })
  const rgb = [1, 3, 5].map((start) =>
    parseInt(color.slice(start, start + 2), 16)
  )
  region.append(canvas)
  grid.style.visibility = "hidden"
  return {
    prepare() {},
    paint(
      time: number | undefined,
      visibility: number,
      amplitude: number,
      pointer: { x: number; y: number } | null
    ) {
      context.setTransform(scale, 0, 0, scale, 0, 0)
      context.clearRect(0, 0, size.width, size.height)
      for (const particle of particles) {
        const value = particle.sample(time, visibility, amplitude, pointer)
        if (value.backgroundColor === "transparent") continue
        const transform = value.transform.match(
          /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/
        )
        const strength = value.backgroundColor.match(/ ([\d.e-]+)%/)
        if (!transform || !strength) continue
        const length = 8 * Number(transform[3])
        const x = left + particle.x * 9 + 4 + Number(transform[1]) - length / 2
        const y =
          particle.y * 9 - shiftY + 4 + Number(transform[2]) - length / 2
        context.fillStyle = `rgba(${rgb.join(",")},${Math.min(1, Math.max(0, Number(strength[1]) / 100))})`
        context.fillRect(x, y, length, length)
      }
    },
    dispose() {
      canvas.remove()
      canvas.width = canvas.height = 0
      grid.style.visibility = previousVisibility
    },
  }
}
