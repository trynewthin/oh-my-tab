import { acquirePixiRenderer, presentPixi } from "@/lib/pixi/shared-renderer"
import type { resolveFolderGlow } from "@/lib/folder-glow"
import { subscribeBurningFrame } from "./burning-clock"

export function mountPixiFolder(
  element: HTMLElement,
  color: string,
  animated: boolean,
  glow: ReturnType<typeof resolveFolderGlow>
) {
  const lease = acquirePixiRenderer()
  let stopped = false
  let cleanup: (() => void) | undefined
  void Promise.all([lease.ready, import("pixi.js")])
    .then(([renderer, { Container, Sprite, Texture }]) => {
      if (stopped) return
      const canvas = document.createElement("canvas")
      canvas.dataset.pixiFolder = ""
      canvas.style.cssText =
        "position:absolute;inset:0;border-radius:inherit;pointer-events:none"
      element.append(canvas)
      const source = document.createElement("canvas")
      source.width = source.height = 256
      const ctx = source.getContext("2d")!
      const rgb = [1, 3, 5]
        .map((start) => parseInt(color.slice(start, start + 2), 16))
        .join(",")
      function arc(
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        alpha: number
      ) {
        ctx.save()
        ctx.translate(cx * 256, cy * 256)
        ctx.scale(rx * 256, ry * 256)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        gradient.addColorStop(0, `rgba(${rgb},0)`)
        gradient.addColorStop(0.48, `rgba(${rgb},0)`)
        gradient.addColorStop(0.66, `rgba(${rgb},${alpha * 0.25})`)
        gradient.addColorStop(0.76, `rgba(${rgb},${alpha})`)
        gradient.addColorStop(0.82, `rgba(${rgb},${alpha * 0.5})`)
        gradient.addColorStop(1, `rgba(${rgb},0)`)
        ctx.fillStyle = gradient
        ctx.fillRect(-4, -4, 8, 8)
        ctx.restore()
      }
      arc(glow.x, glow.y, glow.radiusX, glow.radiusY, glow.opacity)
      const texture = Texture.from(source)
      const stage = new Container(),
        sprite = new Sprite(texture)
      sprite.anchor.set(0.5)
      stage.addChild(sprite)
      element.dataset.pixiFolderReady = ""
      let width = element.clientWidth,
        height = element.clientHeight
      let unsubscribe: (() => void) | undefined
      const paint = (time?: number) => {
        const moving = time !== undefined && animated
        const phase = (time ?? 0) * glow.speed + glow.phase
        sprite.width = width * (moving ? 1.36 + Math.sin(phase) * 0.12 : 1)
        sprite.height =
          height * (moving ? 1.36 + Math.cos(phase * 0.83) * 0.12 : 1)
        sprite.x = width * (moving ? 0.5 + Math.sin(phase * 0.71) * 0.08 : 0.5)
        sprite.y =
          height * (moving ? 0.5 + Math.cos(phase * 0.63) * 0.08 : 0.5)
        sprite.alpha = moving ? 0.88 + Math.sin(phase * 1.17) * 0.12 : 1
        presentPixi(renderer, stage, canvas, width, height)
      }
      const resize = new ResizeObserver(() => {
        width = element.clientWidth
        height = element.clientHeight
        paint()
      })
      const observer = new IntersectionObserver(([entry]) => {
        unsubscribe?.()
        unsubscribe = undefined
        if (entry.isIntersecting && animated)
          unsubscribe = subscribeBurningFrame(paint)
        else if (entry.isIntersecting) paint()
      })
      resize.observe(element)
      observer.observe(element)
      paint()
      cleanup = () => {
        unsubscribe?.()
        resize.disconnect()
        observer.disconnect()
        canvas.remove()
        delete element.dataset.pixiFolderReady
        stage.destroy({ children: true })
        texture.destroy(true)
      }
    })
    .catch(() => {})
  return () => {
    stopped = true
    cleanup?.()
    lease.release()
  }
}
