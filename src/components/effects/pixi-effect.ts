import { acquirePixiRenderer, presentPixi } from "@/lib/pixi/shared-renderer"
import { createBurningTexture } from "./burning-texture"
import { createParticleCell } from "./particle-texture"
import {
  TEXTURE_CELL_SIZE,
  TEXTURE_STEP,
  type TextureGrid,
} from "./texture-grid"

type Point = { x: number; y: number } | null
export type PixiEffect = {
  update: (color: string, grid: TextureGrid) => boolean
  paint: (
    time: number | undefined,
    visibility: number,
    amplitude: number,
    pointer?: Point
  ) => boolean
  dispose: () => void
}
export function createPixiEffect(
  region: HTMLElement,
  color: string,
  seed: number,
  geometry: TextureGrid,
  textureRow: number,
  mode: "burning" | "particles"
): PixiEffect {
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
  let { columns, rows } = geometry
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
      // A WebGL failure can leave the scene partially built; the DOM texture
      // below stays the authoritative fallback.
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
            sample: createParticleCell(color, seed, x, textureRow + y, columns),
          }
        })
      const cells = createCells()
      updateScene = (previous) => {
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
              textureRow + entry.y,
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
            burning(x, textureRow + y, time, visibility, amplitude)
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
            const scaled = TEXTURE_CELL_SIZE * Number(transform[3])
            sprite.position.set(
              geometry.left +
                x * TEXTURE_STEP +
                TEXTURE_CELL_SIZE / 2 +
                Number(transform[1]) -
                scaled / 2,
              geometry.top +
                y * TEXTURE_STEP +
                TEXTURE_CELL_SIZE / 2 +
                Number(transform[2]) -
                scaled / 2
            )
            sprite.width = sprite.height = scaled
          } else {
            sprite.position.set(
              geometry.left + x * TEXTURE_STEP,
              geometry.top + y * TEXTURE_STEP
            )
            sprite.width = sprite.height = TEXTURE_CELL_SIZE
          }
        }
        try {
          presentPixi(
            renderer,
            stage,
            canvas,
            Math.ceil(geometry.width),
            Math.ceil(geometry.height)
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
    update(nextColor: string, nextGrid: TextureGrid) {
      const previous = { color, columns, rows }
      color = nextColor
      geometry = nextGrid
      columns = nextGrid.columns
      rows = nextGrid.rows
      updateScene?.(previous)
      return draw?.() ?? !failed
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
