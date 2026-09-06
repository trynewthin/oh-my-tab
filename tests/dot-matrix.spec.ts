import { expect, test } from "@playwright/test"

for (const [width, columns, format] of [
  [1440, 51, "seconds"],
  [480, 29, "minutes"],
  [375, 22, "compact"],
  [320, 18, "compact"],
] as const) {
  test(`matrix keeps cell size at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await page.addInitScript(() =>
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
    )
    await page.goto("/")
    const matrix = page.locator("[data-matrix-columns]")
    await expect(matrix).toHaveAttribute("data-matrix-columns", String(columns))
    await expect(matrix).toHaveAttribute("data-time-format", format)
    await expect(matrix.locator("span")).toHaveCount(columns * 7)
    const cell = await matrix.locator("span").first().boundingBox()
    expect(cell!.width).toBe(12)
    expect(cell!.height).toBe(12)
    expect((await matrix.boundingBox())!.height).toBe(102)
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth
      )
    ).toBe(true)
  })
}

test("long text scrolls and fits after widening", async ({ page }) => {
  await page.clock.install()
  await page.setViewportSize({ width: 375, height: 800 })
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    localStorage.setItem(
      "omt.home-settings",
      JSON.stringify({
        state: {
          content: "text",
          text: "OH MY TAB",
          color: "#3478f6",
          topComponent: "dot-matrix",
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const matrix = page.getByRole("img", { name: "OH MY TAB", exact: true })
  await expect(matrix).toHaveAttribute("data-matrix-columns", "22")
  const snapshot = () =>
    matrix
      .locator("span")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLElement).style.backgroundColor)
      )
  const before = await snapshot()
  await page.clock.runFor(560)
  expect(await snapshot()).not.toEqual(before)
  await page.emulateMedia({ reducedMotion: "reduce" })
  const still = await snapshot()
  await page.clock.runFor(560)
  expect(await snapshot()).toEqual(still)
  await page.setViewportSize({ width: 1440, height: 900 })
  await expect(matrix).toHaveAttribute("data-matrix-columns", "51")
})

for (const content of ["pet", "breathing"] as const) {
  test(`${content} uses the available columns without shrinking cells`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.addInitScript(
      ({ content }) => {
        localStorage.setItem(
          "omt.onboarding",
          JSON.stringify({ state: { seen: true }, version: 0 })
        )
        localStorage.setItem(
          "omt.home-settings",
          JSON.stringify({
            state: {
              content,
              pet: "cat",
              color: "#3478f6",
              topComponent: "dot-matrix",
            },
            version: 0,
          })
        )
      },
      { content }
    )
    await page.goto("/")
    const matrix = page.locator("[data-matrix-columns]")
    await expect(matrix.locator("span")).toHaveCount(18 * 7)
    await page.setViewportSize({ width: 480, height: 800 })
    await expect(matrix.locator("span")).toHaveCount(29 * 7)
    expect((await matrix.boundingBox())!.height).toBe(102)
  })
}

for (const [pet, frames] of [
  ["cat", 12],
  ["dog", 9],
  ["happy", 9],
  ["sleepy", 15],
] as const) {
  test(`${pet} kaomoji has its own motion on mobile`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 800 })
    await page.clock.install()
    await page.addInitScript(
      ({ pet }) => {
        localStorage.setItem(
          "omt.onboarding",
          JSON.stringify({ state: { seen: true }, version: 0 })
        )
        localStorage.setItem(
          "omt.home-settings",
          JSON.stringify({
            state: {
              content: "pet",
              pet,
              color: "#3478f6",
              topComponent: "dot-matrix",
            },
            version: 0,
          })
        )
      },
      { pet }
    )
    await page.goto("/")
    const matrix = page.getByRole("img", { name: /颜文字宠物/ })
    await expect(matrix.locator("span")).toHaveCount(126)
    const snapshot = () =>
      matrix
        .locator("span")
        .evaluateAll((nodes) =>
          nodes.map((node) => (node as HTMLElement).style.backgroundColor)
        )
    const before = await snapshot()
    await page.clock.runFor(frames * 220)
    expect(await snapshot()).not.toEqual(before)
    await page.emulateMedia({ reducedMotion: "reduce" })
    const still = await snapshot()
    await page.clock.runFor(2200)
    expect(await snapshot()).toEqual(still)
  })
}
