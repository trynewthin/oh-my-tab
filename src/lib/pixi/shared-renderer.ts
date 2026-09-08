import type { Container, WebGLRenderer } from "pixi.js"

let shared: Promise<WebGLRenderer> | undefined
let clients = 0
let generation = 0
export function acquirePixiRenderer() {
  clients++
  generation++
  shared ??= (async () => {
    const { WebGLRenderer } = await import("pixi.js")
    await import("pixi.js/unsafe-eval")
    const renderer = new WebGLRenderer()
    await renderer.init({
      width: 1,
      height: 1,
      resolution: 1,
      backgroundAlpha: 0,
      antialias: false,
      powerPreference: "low-power",
    })
    return renderer
  })()
  const ready = shared
  let released = false
  return {
    ready,
    release() {
      if (released) return
      released = true
      clients--
      const token = ++generation
      // A component changing size can acquire the existing renderer immediately.
      queueMicrotask(() => {
        if (clients || generation !== token || shared !== ready) return
        shared = undefined
        void ready.then(
          (renderer) => renderer.destroy(true),
          () => {}
        )
      })
    },
  }
}

export function presentPixi(
  renderer: WebGLRenderer,
  stage: Container,
  canvas: HTMLCanvasElement,
  width: number,
  height: number
) {
  const resolution = window.devicePixelRatio || 1
  const w = Math.max(1, Math.ceil(width * resolution))
  const h = Math.max(1, Math.ceil(height * resolution))
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w
    canvas.height = h
  }
  canvas.style.width = `${width}px`
  canvas.style.height = `${height}px`
  const context = canvas.getContext("2d")!
  if (renderer.width < w || renderer.height < h)
    renderer.resize(Math.max(renderer.width, w), Math.max(renderer.height, h))
  stage.scale.set(resolution)
  renderer.render({ container: stage })
  context.clearRect(0, 0, w, h)
  context.drawImage(renderer.canvas, 0, 0, w, h, 0, 0, w, h)
  canvas.dataset.renderCount = String(
    Number(canvas.dataset.renderCount ?? 0) + 1
  )
}
