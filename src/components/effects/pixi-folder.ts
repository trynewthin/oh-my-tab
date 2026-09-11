import { acquirePixiRenderer, presentPixi } from "@/lib/pixi/shared-renderer"
import { subscribeBurningFrame } from "./burning-clock"

export function mountPixiFolder(
  element: HTMLElement,
  color: string,
  animated: boolean
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
      function ellipse(
        cx: number,
        cy: number,
        rx: number,
        ry: number,
        alpha: number,
        end: number
      ) {
        ctx.save()
        ctx.translate(cx * 256, cy * 256)
        ctx.scale(rx * 256, ry * 256)
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, 1)
        gradient.addColorStop(0, `rgba(${rgb},${alpha})`)
        gradient.addColorStop(end, "transparent")
        ctx.fillStyle = gradient
        ctx.fillRect(-4, -4, 8, 8)
        ctx.restore()
      }
      ellipse(0.65, 1.15, 1.1, 0.45, 0.14, 0.75)
      ellipse(1.05, 0, 0.95, 0.65, 0.26, 0.72)
      const texture = Texture.from(source)
      const stage = new Container(),
        sprite = new Sprite(texture)
      stage.addChild(sprite)
      element.dataset.pixiFolderReady = ""
      let width = element.clientWidth,
        height = element.clientHeight
      let unsubscribe: (() => void) | undefined
      const paint = (time?: number) => {
        const moving = time !== undefined && animated
        const scale = moving ? 1.16 : 1
        sprite.width = width * scale
        sprite.height = height * scale
        sprite.x = moving
          ? (width - sprite.width) / 2 + Math.sin(time * 0.72) * width * 0.06
          : 0
        sprite.y = moving
          ? (height - sprite.height) / 2 + Math.cos(time * 0.58) * height * 0.06
          : 0
        sprite.alpha = moving ? 0.74 + Math.sin(time * 0.9) * 0.18 : 1
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
