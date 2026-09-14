import { acquirePixiRenderer, presentPixi } from "@/lib/pixi/shared-renderer"
import { createBurningTexture } from "./burning-texture"
import { createParticleCell } from "./particle-texture"

type Point = { x: number; y: number } | null
export function createPixiEffect(
  region: HTMLElement,
  color: string,
  seed: number,
  columns: number,
  rows: number,
  offsetY: number,
  size: { width: number; height: number },
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
  let disposeScene: (() => void) | undefined
  let draw: (() => void) | undefined
  let latest: [number | undefined, number, number, Point] = [
    undefined,
    1,
    1,
    null,
  ]
  let bounds = region.getBoundingClientRect()
  const firstRow = Math.floor(offsetY / 9)
  const shift = offsetY % 9
  let left = size.width - (columns * 9 - 1)
  let burning = createBurningTexture(color, seed, columns)
  let updateScene:
    | ((previous: { color: string; columns: number; rows: number }) => void)
    | undefined
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
        left = size.width - (columns * 9 - 1)
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
        if (stopped || document.hidden) return
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
            const length = 8 * Number(transform[3])
            sprite.position.set(
              left + x * 9 + 4 + Number(transform[1]) - length / 2,
              y * 9 - shift + 4 + Number(transform[2]) - length / 2
            )
            sprite.width = sprite.height = length
          } else {
            const cellX = bounds.left + left + x * 9,
              cellY = bounds.top + y * 9 - shift
            sprite.position.set(
              Math.round(cellX) - Math.round(bounds.left),
              Math.round(cellY) - Math.round(bounds.top)
            )
            sprite.width = Math.round(cellX + 8) - Math.round(cellX)
            sprite.height = Math.round(cellY + 8) - Math.round(cellY)
          }
        }
        canvas.style.left =
          mode === "burning"
            ? `${Math.round(bounds.left) - bounds.left}px`
            : "0"
        canvas.style.top =
          mode === "burning" ? `${Math.round(bounds.top) - bounds.top}px` : "0"
        presentPixi(
          renderer,
          stage,
          canvas,
          Math.ceil(size.width),
          Math.ceil(size.height)
        )
      }
      draw()
    })
    .catch(() => {
      grid.style.visibility = previous
    })
  return {
    update(
      nextColor: string,
      nextColumns: number,
      nextRows: number,
      nextSize: { width: number; height: number }
    ) {
      const previous = { color, columns, rows }
      color = nextColor
      columns = nextColumns
      rows = nextRows
      size = nextSize
      bounds = region.getBoundingClientRect()
      updateScene?.(previous)
      draw?.()
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
      draw?.()
    },
    dispose() {
      stopped = true
      canvas.remove()
      canvas.width = canvas.height = 0
      disposeScene?.()
      lease.release()
      grid.style.visibility = previous
    },
  }
}
