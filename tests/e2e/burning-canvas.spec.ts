import { expect, test, type Locator } from "@playwright/test"
import sharp from "sharp"

const SURFACE = '[data-grid-item-id="flame"] [data-effect-style]'

type Layer = {
  data: Buffer
  width: number
  height: number
  channels: number
}

async function decode(buffer: Buffer): Promise<Layer> {
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true })
  return {
    data,
    width: info.width,
    height: info.height,
    channels: info.channels,
  }
}

// A pixel is "inked" when any channel is measurably darker than the card.
function inkCoverage(layer: Layer) {
  let count = 0
  for (let i = 0; i < layer.data.length; i += layer.channels) {
    if (
      layer.data[i] < 250 ||
      layer.data[i + 1] < 250 ||
      layer.data[i + 2] < 250
    ) {
      count++
    }
  }
  return count / (layer.width * layer.height)
}

// Per-cell centre comparison: the canvas layer and the DOM reference layer must
// agree at the centre of every rendered texture cell. Cell centres are sampled
// rather than whole pixels because the canvas and the CSS grid rasterize
// fractional cell edges through different paths; a one-device-pixel edge
// rounding shifts a few boundary columns by up to 68/255 while the cell bodies
// agree within 2/255.
function maxCentreDelta(
  canvas: Layer,
  reference: Layer,
  centres: [number, number][],
  scale: number
) {
  let max = 0
  for (const [cx, cy] of centres) {
    const x = Math.round(cx * scale)
    const y = Math.round(cy * scale)
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) continue
    const i = (y * canvas.width + x) * canvas.channels
    const delta = Math.max(
      Math.abs(canvas.data[i] - reference.data[i]),
      Math.abs(canvas.data[i + 1] - reference.data[i + 1]),
      Math.abs(canvas.data[i + 2] - reference.data[i + 2])
    )
    if (delta > max) max = delta
  }
  return max
}

async function cellCentres(surface: Locator): Promise<[number, number][]> {
  return surface.evaluate((element: HTMLElement) => {
    const box = element.getBoundingClientRect()
    return Array.from(
      element.querySelectorAll<HTMLElement>("[data-burn-cell]"),
      (cell): [number, number] => {
        const rect = cell.getBoundingClientRect()
        return [
          rect.left + rect.width / 2 - box.left,
          rect.top + rect.height / 2 - box.top,
        ]
      }
    )
  })
}

for (const width of [390, 1440]) {
  for (const deviceScaleFactor of [1, 2]) {
    test.describe(`${width}px at ${deviceScaleFactor}x`, () => {
      test.use({
        viewport: { width, height: 1000 },
        deviceScaleFactor,
        reducedMotion: "reduce",
      })
      test("burning canvas renders the DOM texture and resizes while motion is reduced", async ({
        page,
      }) => {
        await page.route("https://**/*", (route) => route.abort())
        await page.addInitScript(() => {
          localStorage.setItem(
            "omt.onboarding",
            JSON.stringify({ state: { seen: true }, version: 0 })
          )
          localStorage.setItem(
            "omt.home-settings",
            JSON.stringify({
              state: {
                topComponent: "none",
                effectStyle: "burning",
                transitionsEnabled: false,
              },
              version: 0,
            })
          )
          localStorage.setItem(
            "omt.tab-grid",
            JSON.stringify({
              state: {
                items: [
                  {
                    id: "flame",
                    kind: "tab",
                    name: "Flame",
                    url: "https://example.com",
                    size: "medium",
                    color: "#3478f6",
                    dynamicEffect: true,
                  },
                ],
                layouts: {},
              },
              version: 0,
            })
          )
        })
        await page.goto("/")
        const surface = page.locator(SURFACE)
        const canvas = surface.locator("canvas[data-burning-canvas]")
        const reference = surface.locator("[data-burn-cell]").first()

        const hideCanvas = () =>
          surface.evaluate((element) => {
            const layer = element.querySelector("canvas")!
            layer.style.visibility = "hidden"
            ;(layer.previousElementSibling as HTMLElement).style.visibility =
              "visible"
          })
        const showCanvas = () =>
          surface.evaluate((element) => {
            const layer = element.querySelector("canvas")!
            layer.style.visibility = "visible"
            ;(layer.previousElementSibling as HTMLElement).style.visibility =
              "hidden"
          })

        // The canvas layer reports the raster box it paints into, and the
        // measured region geometry must drive it exactly: the surface owns the
        // device-pixel backing store, so a stale or fractional box would blur
        // every texture cell. Resizing recreates the canvas, so the box is
        // transiently absent; callers poll until it settles.
        const rasterBox = () =>
          surface.evaluate((element) => {
            const layer = element.querySelector("canvas")
            const region = element.firstElementChild as HTMLElement | null
            if (!layer || !region) return null
            const rect = region.getBoundingClientRect()
            const scale = window.devicePixelRatio || 1
            return {
              width: layer.width,
              height: layer.height,
              expectedWidth: Math.ceil(Math.ceil(rect.width) * scale),
              expectedHeight: Math.ceil(Math.ceil(rect.height) * scale),
              scale,
            }
          })

        await expect(canvas).toBeVisible()
        // The visible layer is the canvas; the DOM cell grid underneath keeps
        // its layout (visibility, not display) so its geometry stays measurable.
        await expect(reference).toBeAttached()
        let centres = await cellCentres(surface)
        expect(centres.length).toBeGreaterThan(0)

        const rendered = await decode(await surface.screenshot())
        await hideCanvas()
        const dom = await decode(await surface.screenshot())
        expect(rendered.width).toBe(dom.width)
        expect(rendered.height).toBe(dom.height)

        // 1. Both layers must paint the same amount of texture. A blank canvas
        //    collapses to ~0.02 coverage against the reference's ~0.37.
        const canvasInk = inkCoverage(rendered)
        const domInk = inkCoverage(dom)
        expect(Math.abs(canvasInk - domInk)).toBeLessThan(0.05)

        // 2. Cell bodies must match the DOM texture. Measured rest state is
        //    within 2/255; a blank layer, a wrong colour, a shifted grid or a
        //    different per-cell fill all exceed 15/255.
        await expect.poll(rasterBox).not.toBeNull()
        const box = (await rasterBox())!
        expect(maxCentreDelta(rendered, dom, centres, box.scale)).toBeLessThanOrEqual(8)

        await showCanvas()
        await expect(canvas).toBeVisible()

        // 3. Under reduced motion the texture is a still frame: two captures
        //    that are far enough apart to contain several animation frames must
        //    be byte-identical. Measured animated deltas are 63..68.
        const still = await decode(await surface.screenshot())
        await page.waitForTimeout(400)
        const later = await decode(await surface.screenshot())
        let frozenDelta = 0
        for (let i = 0; i < still.data.length; i++) {
          const delta = Math.abs(still.data[i] - later.data[i])
          if (delta > frozenDelta) frozenDelta = delta
        }
        expect(frozenDelta).toBe(0)

        // 4. The reduced-motion preference must gate a live pipeline rather
        //    than a dead one: the same surface animates once motion is allowed.
        await page.emulateMedia({ reducedMotion: "no-preference" })
        await page.mouse.move(10, 10)
        await expect
          .poll(async () => {
            const first = await decode(await surface.screenshot())
            await page.waitForTimeout(250)
            const second = await decode(await surface.screenshot())
            let delta = 0
            for (let i = 0; i < first.data.length; i++) {
              const value = Math.abs(first.data[i] - second.data[i])
              if (value > delta) delta = value
            }
            return delta
          })
          .toBeGreaterThan(4)
        await page.emulateMedia({ reducedMotion: "reduce" })

        // 5. Resizing re-rasterizes the surface: the backing store tracks the
        //    new region geometry at the active density and the texture still
        //    matches the DOM layer. The canvas is recreated during the resize,
        //    so poll until the backing store settles on the new measured box.
        const oldWidth = box.width
        await page.setViewportSize({
          width: width === 1440 ? 1280 : width - 16,
          height: 1000,
        })
        await expect(canvas).toBeVisible()
        await expect
          .poll(async () => {
            const box = await rasterBox()
            return box ? box.width : oldWidth
          })
          .not.toBe(oldWidth)
        await expect
          .poll(async () => {
            const box = await rasterBox()
            if (!box) return false
            return (
              box.width === box.expectedWidth &&
              box.height === box.expectedHeight
            )
          })
          .toBe(true)
        const resized = (await rasterBox())!
        expect(resized.width).toBe(resized.expectedWidth)
        expect(resized.height).toBe(resized.expectedHeight)

        centres = await cellCentres(surface)
        const resizedRendered = await decode(await surface.screenshot())
        await hideCanvas()
        const resizedDom = await decode(await surface.screenshot())
        expect(
          Math.abs(inkCoverage(resizedRendered) - inkCoverage(resizedDom))
        ).toBeLessThan(0.05)
        expect(
          maxCentreDelta(resizedRendered, resizedDom, centres, resized.scale)
        ).toBeLessThanOrEqual(8)
      })
    })
  }
}
