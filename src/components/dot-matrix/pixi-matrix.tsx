import { useEffect, useRef } from "react"
import type { Bitmap } from "./bitmap-font"
import { CELL_SIZE, CELL_GAP } from "./responsive-layout"
import type { Container, Sprite, Texture, WebGLRenderer } from "pixi.js"

type Props = {
  pixels: Bitmap
  color: string
  ocean: boolean
  onFailure: () => void
}
type Scene = {
  renderer: WebGLRenderer
  stage: Container
  texture: Texture
  sprites: Sprite[]
  colors: number[]
  columns: number
  rows: number
  draw: () => void
}

export default function PixiMatrix(props: Props) {
  const host = useRef<HTMLDivElement>(null)
  const latest = useRef(props)
  const scene = useRef<Scene | null>(null)
  useEffect(() => {
    latest.current = props
    scene.current?.draw()
  }, [props])
  useEffect(() => {
    const element = host.current!
    let cancelled = false
    let dispose: (() => void) | undefined
    void (async () => {
      const { WebGLRenderer, Container, Sprite, Texture } =
        await import("pixi.js")
      await import("pixi.js/unsafe-eval")
      if (cancelled) return
      const renderer = new WebGLRenderer()
      await renderer.init({
        width: 1,
        height: 1,
        backgroundAlpha: 0,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
        antialias: false,
        powerPreference: "low-power",
      })
      if (cancelled) {
        renderer.destroy(true)
        return
      }
      const tile = document.createElement("canvas")
      tile.width = tile.height = CELL_SIZE * 2
      const ctx = tile.getContext("2d")!
      ctx.fillStyle = "white"
      ctx.beginPath()
      ctx.roundRect(0, 0, tile.width, tile.height, 6)
      ctx.fill()
      const texture = Texture.from(tile)
      const stage = new Container()
      stage.eventMode = "none"
      const probe = document.createElement("span")
      probe.style.backgroundColor = "var(--muted)"
      probe.style.display = "none"
      element.append(probe, renderer.canvas)
      const resolver = document
        .createElement("canvas")
        .getContext("2d", { willReadFrequently: true })!
      let mutedCss = ""
      let muted = [0, 0, 0]
      const state: Scene = {
        renderer,
        stage,
        texture,
        sprites: [],
        colors: [],
        columns: 0,
        rows: 0,
        draw: () => {
          if (document.hidden) return
          const { pixels, color, ocean } = latest.current
          const columns = pixels[0]?.length ?? 0
          const rows = pixels.length
          if (!columns || !rows) return
          const css = getComputedStyle(probe).backgroundColor
          if (css !== mutedCss) {
            mutedCss = css
            resolver.clearRect(0, 0, 1, 1)
            resolver.fillStyle = css
            resolver.fillRect(0, 0, 1, 1)
            muted = Array.from(resolver.getImageData(0, 0, 1, 1).data).slice(
              0,
              3
            )
          }
          let dirty = false
          if (columns !== state.columns || rows !== state.rows) {
            stage.removeChildren().forEach((child) => child.destroy())
            state.sprites = pixels.flatMap((row, y) =>
              row.map((_, x) => {
                const sprite = new Sprite(texture)
                sprite.position.set(
                  x * (CELL_SIZE + CELL_GAP),
                  y * (CELL_SIZE + CELL_GAP)
                )
                sprite.width = sprite.height = CELL_SIZE
                stage.addChild(sprite)
                return sprite
              })
            )
            state.columns = columns
            state.rows = rows
            state.colors = []
            renderer.resize(
              columns * (CELL_SIZE + CELL_GAP) - CELL_GAP,
              rows * (CELL_SIZE + CELL_GAP) - CELL_GAP
            )
            dirty = true
          }
          const rgb = [1, 3, 5].map((start) =>
            parseInt(color.slice(start, start + 2), 16)
          )
          pixels.flat().forEach((value, index) => {
            const mix = ocean
              ? Math.min(1, Math.max(0, value)) * 0.45
              : value
                ? 1
                : 0
            const channels = rgb.map((channel, i) =>
              Math.round(channel * mix + muted[i] * (1 - mix))
            )
            const tint = (channels[0] << 16) | (channels[1] << 8) | channels[2]
            if (state.colors[index] !== tint) {
              state.sprites[index].tint = tint
              state.colors[index] = tint
              dirty = true
            }
          })
          if (dirty) {
            renderer.render({ container: stage })
            element.dataset.renderCount = String(
              Number(element.dataset.renderCount ?? 0) + 1
            )
          }
        },
      }
      scene.current = state
      const theme = new MutationObserver(state.draw)
      theme.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class", "style"],
      })
      document.addEventListener("visibilitychange", state.draw)
      const lost = (event: Event) => {
        event.preventDefault()
        latest.current.onFailure()
      }
      renderer.canvas.addEventListener("webglcontextlost", lost)
      dispose = () => {
        theme.disconnect()
        document.removeEventListener("visibilitychange", state.draw)
        renderer.canvas.removeEventListener("webglcontextlost", lost)
        scene.current = null
        stage.destroy({ children: true })
        texture.destroy(true)
        renderer.destroy(true)
        probe.remove()
      }
      state.draw()
    })().catch(() => {
      dispose?.()
      if (!cancelled) latest.current.onFailure()
    })
    return () => {
      cancelled = true
      dispose?.()
    }
  }, [])
  return <div ref={host} data-pixi-matrix="" aria-hidden="true" />
}
