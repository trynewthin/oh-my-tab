import { expect, test } from "@playwright/test"

test("Pixi matrix renders at the existing dimensions and remains idle for static text", async ({ page }, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem("omt.onboarding", JSON.stringify({ state: { seen: true }, version: 0 }))
    localStorage.setItem("omt.home-settings", JSON.stringify({ state: { content: "text", text: "HELLO", topComponent: "dot-matrix" }, version: 0 }))
  })
  await page.goto("/")
  const matrix = page.locator("[data-matrix-columns]")
  await expect(matrix).toHaveAttribute("data-matrix-renderer", "pixi")
  const canvas = matrix.locator("canvas")
  await expect(canvas).toBeVisible()
  expect((await canvas.boundingBox())!.height).toBe(102)
  const count = await matrix.locator("[data-pixi-matrix]").getAttribute("data-render-count")
  await page.waitForTimeout(1200)
  await expect(matrix.locator("[data-pixi-matrix]")).toHaveAttribute("data-render-count", count!)
  await page.screenshot({ path: testInfo.outputPath("pixi-matrix.png") })
  await page.setViewportSize({ width: 375, height: 900 })
  await expect(matrix).toHaveAttribute("data-matrix-columns", "22")
  await expect(matrix.locator("canvas")).toBeVisible()
  expect((await matrix.boundingBox())!.width).toBe(327)
})

test("Pixi clock updates and keeps an accessible time label", async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem("omt.onboarding", JSON.stringify({ state: { seen: true }, version: 0 })))
  await page.goto("/")
  const matrix = page.locator("[data-matrix-columns]")
  await expect(matrix.locator("canvas")).toBeVisible()
  const before = await matrix.getAttribute("aria-label")
  await expect.poll(() => matrix.getAttribute("aria-label")).not.toBe(before)
  await expect(matrix.locator("[data-pixi-matrix]")).not.toHaveAttribute("data-render-count", "1")
})
