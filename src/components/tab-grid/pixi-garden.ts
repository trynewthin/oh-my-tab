import { acquirePixiRenderer, presentPixi } from "@/lib/pixi/shared-renderer"
import type { Container, Texture } from "pixi.js"

const ANIMATED =
  ".ecosystem-plant, .garden-growth, .garden-leaf, .garden-blossom"
function ease(value: number) {
  let low = 0,
    high = 1,
    t = value
  for (let i = 0; i < 10; i++) {
    t = (low + high) / 2
    const x =
      3 * (1 - t) * (1 - t) * t * 0.42 + 3 * (1 - t) * t * t * 0.58 + t * t * t
    if (x < value) low = t
    else high = t
  }
  return 3 * (1 - t) * t * t + t * t * t
}
function wave(
  seconds: number,
  duration: number,
  delay: number,
  alternate = false
) {
  const position = Math.max(0, (seconds - delay) / duration)
  const phase = position % 1
  return alternate && Math.floor(position) % 2 ? 1 - phase : phase
}

export function mountPixiGarden(svg: SVGSVGElement, animated = true) {
  const canvas = document.createElement("canvas")
  canvas.dataset.pixiGarden = ""
  canvas.setAttribute("aria-hidden", "true")
  canvas.style.cssText = "position:absolute;inset:0;pointer-events:none"
  const lease = acquirePixiRenderer()
  const textures: Texture[] = []
  let stopped = false
  let cleanup: (() => void) | undefined
  let stage: Container | undefined
  const previous = svg.style.visibility
  const started = performance.now()
  void Promise.all([lease.ready, import("pixi.js")])
    .then(async ([renderer, { Container, Sprite, Texture, Matrix }]) => {
      if (stopped) return
      const animations: Array<(time: number, reduced: boolean) => void> = []
      const raster = async (element: Element) => {
        const shell = document.createElementNS(
          "http://www.w3.org/2000/svg",
          "svg"
        )
        shell.setAttribute("xmlns", "http://www.w3.org/2000/svg")
        shell.setAttribute("viewBox", "0 0 64 64")
        shell.setAttribute("width", "256")
        shell.setAttribute("height", "256")
        shell.setAttribute("shape-rendering", "crispEdges")
        const clone = element.cloneNode(true) as Element
        if (clone instanceof SVGElement) clone.style.visibility = "visible"
        clone.removeAttribute("data-pixi-source")
        clone.querySelectorAll("title").forEach((title) => title.remove())
        if (element === svg) {
          for (const child of Array.from(clone.children)) shell.append(child)
        } else {
          shell.append(clone)
        }
        const blob = new Blob([new XMLSerializer().serializeToString(shell)], {
          type: "image/svg+xml",
        })
        const url = URL.createObjectURL(blob)
        const image = new Image()
        try {
          image.src = url
          await image.decode()
        } finally {
          URL.revokeObjectURL(url)
        }
        if (stopped) return new Container()
        const texture = Texture.from(image)
        textures.push(texture)
        const sprite = new Sprite(texture)
        sprite.width = sprite.height = 64
        return sprite
      }
      const build = async (element: Element): Promise<Container> => {
        if (!element.matches(ANIMATED) && !element.querySelector(ANIMATED))
          return raster(element)
        const group = new Container()
        const transform = (
          element as SVGGraphicsElement
        ).transform?.baseVal.consolidate()?.matrix
        if (transform)
          group.setFromMatrix(
            new Matrix(
              transform.a,
              transform.b,
              transform.c,
              transform.d,
              transform.e,
              transform.f
            )
          )
        const moving = new Container()
        group.addChild(moving)
        if (element.matches(ANIMATED)) {
          const style = (element as SVGElement).style
          const origin = (style.transformOrigin || "32px 36px")
            .split(" ")
            .map(parseFloat)
          moving.pivot.set(origin[0], origin[1])
          moving.position.set(origin[0], origin[1])
          const delay = parseFloat(
            style.animationDelay ||
              style.getPropertyValue("--plant-delay") ||
              "0"
          )
          const period = parseFloat(
            style.getPropertyValue("--plant-period") || "5"
          )
          const sway = parseFloat(style.getPropertyValue("--plant-sway") || "3")
          animations.push((time, reduced) => {
            moving.rotation = 0
            moving.scale.set(1)
            moving.alpha = 1
            moving.position.set(origin[0], origin[1])
            if (reduced) return
            let angle = 0
            if (element.classList.contains("garden-leaf"))
              angle = -4 + 9 * ease(wave(time, 4.7, delay, true))
            else if (element.classList.contains("garden-blossom")) {
              const p = ease(wave(time, 5.3, delay, true))
              angle = -2 + 4 * p
              moving.scale.set(0.95 + 0.1 * p)
            } else if (element.classList.contains("garden-growth")) {
              const p = Math.min(1, Math.max(0, time / 1.2))
              moving.scale.y = 0.8 + 0.2 * (1 - Math.pow(1 - p, 3))
              moving.alpha = 0.65 + 0.35 * (1 - Math.pow(1 - p, 3))
            } else if (element.getAttribute("data-stage") === "0") {
              const p = wave(time, period, delay)
              const q = ease(p < 0.5 ? p * 2 : (1 - p) * 2)
              angle = -3 + 6 * q
              moving.scale.y = 0.96 + 0.08 * q
            } else {
              const p = wave(time, period, delay)
              if (p < 0.35) {
                const q = ease(p / 0.35)
                angle = -sway + sway * 2 * q
                moving.y -= 0.3 * q
              } else if (p < 0.7) {
                const q = ease((p - 0.35) / 0.35)
                angle = sway + (-0.5 - sway) * q
                moving.y -= 0.3 * (1 - q)
              } else angle = -0.5 + (-sway + 0.5) * ease((p - 0.7) / 0.3)
            }
            moving.rotation = (angle * Math.PI) / 180
          })
        }
        // Preserve paint order; static sibling runs share one cached texture.
        let run = document.createElementNS("http://www.w3.org/2000/svg", "g")
        const flush = async () => {
          if (run.children.length) {
            moving.addChild(await raster(run))
            run = document.createElementNS("http://www.w3.org/2000/svg", "g")
          }
        }
        for (const child of element.children) {
          if (child.tagName === "title") continue
          if (child.matches(ANIMATED) || child.querySelector(ANIMATED)) {
            await flush()
            moving.addChild(await build(child))
          } else run.append(child.cloneNode(true))
        }
        await flush()
        return group
      }
      stage = new Container()
      const art = new Container()
      art.addChild(await build(svg))
      if (stopped) {
        stage.destroy({ children: true })
        textures.forEach((texture) => texture.destroy(true))
        return
      }
      stage.addChild(art)
      const parent = svg.parentElement!
      parent.style.position = "relative"
      parent.append(canvas)
      svg.style.visibility = "hidden"
      svg.dataset.pixiSource = ""
      let width = svg.clientWidth,
        height = svg.clientHeight
      let intersects = true,
        frame = 0
      const motion = matchMedia("(prefers-reduced-motion: reduce)")
      const render = () => {
        const scale = Math.min(width, height) / 64
        art.scale.set(scale)
        art.position.set((width - 64 * scale) / 2, (height - 64 * scale) / 2)
        animations.forEach((animate) =>
          animate(
            (performance.now() - started) / 1000,
            motion.matches || !animated
          )
        )
        presentPixi(renderer, stage!, canvas, width, height)
      }
      const tick = () => {
        frame = 0
        if (stopped || !intersects || document.hidden) return
        render()
        if (animated && !motion.matches && animations.length)
          frame = requestAnimationFrame(tick)
      }
      const resume = () => {
        cancelAnimationFrame(frame)
        frame = 0
        tick()
      }
      const observer = new IntersectionObserver(([entry]) => {
        intersects = entry.isIntersecting
        resume()
      })
      const resize = new ResizeObserver(() => {
        width = svg.clientWidth
        height = svg.clientHeight
        resume()
      })
      observer.observe(svg)
      resize.observe(svg)
      motion.addEventListener("change", resume)
      document.addEventListener("visibilitychange", resume)
      cleanup = () => {
        cancelAnimationFrame(frame)
        observer.disconnect()
        resize.disconnect()
        motion.removeEventListener("change", resume)
        document.removeEventListener("visibilitychange", resume)
        stage?.destroy({ children: true })
        textures.forEach((texture) => texture.destroy(true))
      }
      resume()
    })
    .catch(() => {
      cleanup?.()
      svg.style.visibility = previous
      delete svg.dataset.pixiSource
      canvas.remove()
    })
  return () => {
    stopped = true
    cleanup?.()
    canvas.remove()
    svg.style.visibility = previous
    delete svg.dataset.pixiSource
    lease.release()
  }
}
