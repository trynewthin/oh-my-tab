import { expect, test } from "@playwright/test"
import sharp from "sharp"

for (const width of [390, 1440]) {
  for (const deviceScaleFactor of [1, 2]) {
    test.describe(`${width}px at ${deviceScaleFactor}x`, () => {
      test.use({
        viewport: { width, height: 1000 },
        deviceScaleFactor,
        reducedMotion: "reduce",
      })
      test("burning canvas preserves the DOM texture and resizes while motion is reduced", async ({
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
        const surface = page.locator(
          '[data-grid-item-id="flame"] [data-effect-style]'
        )
        const canvas = surface.locator("canvas")
        await expect(canvas).toBeVisible()
        const rendered = await surface.screenshot()
        await surface.evaluate((element) => {
          const canvas = element.querySelector("canvas")!
          canvas.style.visibility = "hidden"
          ;(canvas.previousElementSibling as HTMLElement).style.visibility =
            "visible"
        })
        const reference = await surface.screenshot()
        const a = await sharp(rendered).ensureAlpha().raw().toBuffer()
        const b = await sharp(reference).ensureAlpha().raw().toBuffer()
        expect(a.length).toBe(b.length)
        let maxDelta = 0
        for (let i = 0; i < a.length; i++)
          maxDelta = Math.max(maxDelta, Math.abs(a[i] - b[i]))
        // Canvas and CSS differ slightly in premultiplied-alpha rounding.
        expect(maxDelta).toBeLessThanOrEqual(2)
        await surface.evaluate((element) => {
          const canvas = element.querySelector("canvas")!
          canvas.style.visibility = "visible"
          ;(canvas.previousElementSibling as HTMLElement).style.visibility =
            "hidden"
        })
        const oldWidth = await canvas.evaluate((c) => c.width)
        await page.setViewportSize({
          width: width === 1440 ? 1280 : width - 16,
          height: 1000,
        })
        await expect(canvas).toBeVisible()
        await expect
          .poll(() => canvas.evaluate((c) => c.width))
          .not.toBe(oldWidth)
      })
    })
  }
}
