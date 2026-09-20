import { acquirePixiRenderer, presentPixi } from "@/lib/pixi/shared-renderer"
import { createBurningTexture } from "./burning-texture"
import { createParticleCell } from "./particle-texture"

type Point = { x: number; y: number } | null
type CellSteps = { stepX: number; stepY: number }
export function createPixiEffect(
  region: HTMLElement,
  color: string,
  seed: number,
  columns: number,
  rows: number,
  offsetY: number,
  size: { width: number; height: number },
  steps: CellSteps,
  mode: "burning" | "particles"
) {
  const canvas = document.createElement("canvas")
  canvas.style.cssText = "position:absolute;top:0;left:0"
  canvas.setAttribute("aria-hidden", "true")
  canvas.dataset[mode === "burning" ? "burningCanvas" : "particleCanvas"] = ""
  canvas.dataset.renderer = "pixi"
  const grid = region.firstElementChild as HTMLElement
  const previous = grid.style.visibility
  const lease = acquirePixiRenderer()
  let stopped = false
  let failed = false
  let released = false
  let disposeScene: (() => void) | undefined
  let draw: (() => boolean) | undefined
  let latest: [number | undefined, number, number, Point] = [
    undefined,
    1,
    1,
    null,
  ]
  let bounds = region.getBoundingClientRect()
  // Cell pitch tracks the surface: step = cell edge + 1px gap, sized so the
  // texture fills the surface exactly (see stepsOf in effect-surface).
  let { stepX, stepY } = steps
  const firstRow = Math.floor(offsetY / stepY)
  const shift = offsetY % stepY
  let left = size.width - (columns * stepX - 1)
  let burning = createBurningTexture(color, seed, columns)
  let updateScene:
    | ((previous: { color: string; columns: number; rows: number }) => void)
    | undefined
  const release = () => {
    if (released) return
    released = true
    lease.release()
  }
  const fail = () => {
    if (failed) return
    failed = true
    canvas.remove()
    canvas.width = canvas.height = 0
    try {
      disposeScene?.()
    } catch {
      // The shared renderer can leave a scene partially built after a WebGL
      // failure. The DOM texture below remains the authoritative fallback.
    }
    disposeScene = undefined
    release()
    grid.style.visibility = previous
  }
  void Promise.all([lease.ready, import("pixi.js")])
    .then(([renderer, { Container, Sprite, Texture }]) => {
      if (stopped) return
      const stage = new Container()
      const createCells = () =>
        Array.from({ length: rows * columns }, (_, index) => {
          const x = index % columns,
            y = Math.floor(index / columns)
          const sprite = new Sprite(Texture.WHITE)
          sprite.tint = color
          stage.addChild(sprite)
          return {
            x,
            y,
            sprite,
            sample: createParticleCell(color, seed, x, firstRow + y, columns),
          }
        })
      const cells = createCells()
      updateScene = (previous) => {
        left = size.width - (columns * stepX - 1)
        burning = createBurningTexture(color, seed, columns)
        if (previous.columns !== columns || previous.rows !== rows) {
          stage.removeChildren().forEach((child) => child.destroy())
          cells.splice(0, cells.length, ...createCells())
          return
        }
        if (previous.color !== color)
          cells.forEach((entry) => {
            entry.sprite.tint = color
            entry.sample = createParticleCell(
              color,
              seed,
              entry.x,
              firstRow + entry.y,
              columns
            )
          })
      }
      region.append(canvas)
      grid.style.visibility = "hidden"
      disposeScene = () => stage.destroy({ children: true })
      draw = () => {
        if (stopped || failed) return false
        if (document.hidden) return true
        const [time, visibility, amplitude, pointer] = latest
        for (const { x, y, sprite, sample } of cells) {
          const value =
            mode === "particles"
              ? sample(time, visibility, amplitude, pointer)
              : null
          const fill =
            value?.backgroundColor ??
            burning(x, firstRow + y, time, visibility, amplitude)
          const alpha = fill.match(/ ([\d.e-]+)%/)
          sprite.visible = !!alpha
          if (!alpha) continue
          sprite.alpha = Math.min(1, Number(alpha[1]) / 100)
          if (value) {
            const transform = value.transform.match(
              /translate\(([-\d.e]+)px, ([-\d.e]+)px\) scale\(([-\d.e]+)\)/
            )
            if (!transform) {
              sprite.visible = false
              continue
            }
            const length = Math.min(stepX, stepY) - 1
            const scaled = length * Number(transform[3])
            sprite.position.set(
              left + x * stepX + stepX / 2 + Number(transform[1]) - scaled / 2,
              y * stepY - shift + stepY / 2 + Number(transform[2]) - scaled / 2
            )
            sprite.width = sprite.height = scaled
          } else {
            const cellX = bounds.left + left + x * stepX,
              cellY = bounds.top + y * stepY - shift
            sprite.position.set(
              Math.round(cellX) - Math.round(bounds.left),
              Math.round(cellY) - Math.round(bounds.top)
            )
            sprite.width = Math.round(cellX + stepX - 1) - Math.round(cellX)
            sprite.height = Math.round(cellY + stepY - 1) - Math.round(cellY)
          }
        }
        canvas.style.left =
          mode === "burning"
            ? `${Math.round(bounds.left) - bounds.left}px`
            : "0"
        canvas.style.top =
          mode === "burning" ? `${Math.round(bounds.top) - bounds.top}px` : "0"
        try {
          presentPixi(
            renderer,
            stage,
            canvas,
            Math.ceil(size.width),
            Math.ceil(size.height)
          )
          return true
        } catch {
          fail()
          return false
        }
      }
      draw()
    })
    .catch(fail)
  return {
    update(
      nextColor: string,
      nextColumns: number,
      nextRows: number,
      nextSize: { width: number; height: number },
      nextSteps: CellSteps
    ) {
      const previous = { color, columns, rows }
      color = nextColor
      columns = nextColumns
      rows = nextRows
      size = nextSize
      stepX = nextSteps.stepX
      stepY = nextSteps.stepY
      bounds = region.getBoundingClientRect()
      updateScene?.(previous)
      return draw?.() ?? !failed
    },
    prepare() {
      bounds = region.getBoundingClientRect()
    },
    paint(
      time: number | undefined,
      visibility: number,
      amplitude: number,
      pointer: Point = null
    ) {
      latest = [time, visibility, amplitude, pointer]
      return draw?.() ?? !failed
    },
    dispose() {
      stopped = true
      canvas.remove()
      canvas.width = canvas.height = 0
      try {
        disposeScene?.()
      } catch {
        // A failed Pixi scene may already be partially destroyed.
      }
      disposeScene = undefined
      release()
      grid.style.visibility = previous
    },
  }
}
