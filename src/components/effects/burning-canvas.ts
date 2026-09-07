import { createBurningTexture } from "./burning-texture"

const CELL_SIZE = 8
const STRIDE = 9

type SurfaceSize = { width: number; height: number }

export function createBurningCanvas(
  region: HTMLElement,
  color: string,
  seed: number,
  columns: number,
  rows: number,
  offsetY: number,
  size: () => SurfaceSize
) {
  const canvas = document.createElement("canvas")
  // Prefer CPU-backed small textures to reduce sustained GPU drawing work.
  const context = canvas.getContext("2d", { willReadFrequently: true })
  if (!context) return null
  canvas.setAttribute("aria-hidden", "true")
  canvas.dataset.burningCanvas = ""
  Object.assign(canvas.style, { position: "absolute", top: "0", left: "0" })
  const texture = createBurningTexture(color, seed, columns)
  const firstRow = Math.floor(offsetY / STRIDE)
  const shiftY = offsetY % STRIDE
  const grid = region.firstElementChild as HTMLElement
  const previousVisibility = grid.style.visibility
  let bounds = region.getBoundingClientRect()
  region.append(canvas)
  grid.style.visibility = "hidden"

  return {
    prepare() {
      bounds = region.getBoundingClientRect()
    },
    paint(time: number | undefined, visibility: number, amplitude: number) {
      const { width, height } = size()
      const scale = window.devicePixelRatio || 1
      const pixelWidth = Math.ceil(Math.ceil(width) * scale)
      const pixelHeight = Math.ceil(Math.ceil(height) * scale)
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth
        canvas.height = pixelHeight
      }
      // Use whole CSS pixels so the browser does not rescale a fractional paint box.
      canvas.style.width = `${pixelWidth / scale}px`
      canvas.style.height = `${pixelHeight / scale}px`
      const originX = Math.round(bounds.left) * scale
      const originY = Math.round(bounds.top) * scale
      canvas.style.left = `${originX / scale - bounds.left}px`
      canvas.style.top = `${originY / scale - bounds.top}px`
      context.clearRect(0, 0, pixelWidth, pixelHeight)
      const left = width - (columns * STRIDE - 1)
      for (let row = 0; row < rows; row++) {
        for (let x = 0; x < columns; x++) {
          const fill = texture(x, firstRow + row, time, visibility, amplitude)
          if (fill === "transparent") continue
          context.fillStyle = fill
          const cellX = bounds.left + left + x * STRIDE
          const cellY = bounds.top + row * STRIDE - shiftY
          const startX = Math.round(cellX) * scale
          const startY = Math.round(cellY) * scale
          context.fillRect(
            startX - originX,
            startY - originY,
            Math.round(cellX + CELL_SIZE) * scale - startX,
            Math.round(cellY + CELL_SIZE) * scale - startY
          )
        }
      }
    },
    dispose() {
      canvas.remove()
      canvas.width = canvas.height = 0
      grid.style.visibility = previousVisibility
    },
  }
}
