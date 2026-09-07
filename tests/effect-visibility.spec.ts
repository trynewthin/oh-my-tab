import { expect, test, type Locator } from "@playwright/test"

async function changes(surface: Locator) {
  return surface.evaluate(
    (element) =>
      new Promise<number>((resolve) => {
        const canvas = element.querySelector("canvas")
        if (canvas) {
          const before = canvas.toDataURL()
          setTimeout(() => resolve(canvas.toDataURL() === before ? 0 : 1), 200)
          return
        }
        let count = 0
        const observer = new MutationObserver((records) => {
          count += records.length
        })
        observer.observe(element, {
          subtree: true,
          attributes: true,
          attributeFilter: ["style"],
        })
        setTimeout(() => {
          observer.disconnect()
          resolve(count)
        }, 200)
      })
  )
}

for (const effectStyle of ["burning", "particles"] as const) {
  test(`${effectStyle} pauses clipped cards and resumes after scrolling and reduced motion`, async ({
    page,
  }) => {
    await page.addInitScript((effectStyle) => {
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
      localStorage.setItem(
        "omt.home-settings",
        JSON.stringify({
          state: {
            topComponent: "none",
            effectStyle,
            transitionsEnabled: false,
          },
          version: 0,
        })
      )
      localStorage.setItem(
        "omt.tab-grid",
        JSON.stringify({
          state: {
            items: Array.from({ length: 60 }, (_, i) => ({
              id: `perf-${i}`,
              kind: "tab",
              name: `Performance ${i}`,
              url: "https://example.com",
              size: "medium",
              color: "#3478f6",
              dynamicEffect: true,
            })),
            layouts: {},
          },
          version: 0,
        })
      )
    }, effectStyle)
    await page.goto("/")
    const first = page.locator(
      '[data-grid-item-id="perf-0"] [data-effect-style]'
    )
    const last = page.locator(
      '[data-grid-item-id="perf-59"] [data-effect-style]'
    )
    await expect(first.locator("[data-burn-cell]").first()).toBeAttached()
    await expect(last.locator("[data-burn-cell]").first()).toBeAttached()
    await expect.poll(() => changes(first)).toBeGreaterThan(0)
    await expect.poll(() => changes(last)).toBe(0)
    await last.scrollIntoViewIfNeeded()
    await expect.poll(() => changes(last)).toBeGreaterThan(0)
    await expect.poll(() => changes(first)).toBe(0)
    await first.scrollIntoViewIfNeeded()
    await expect.poll(() => changes(first)).toBeGreaterThan(0)
    await expect.poll(() => changes(last)).toBe(0)
    await page.emulateMedia({ reducedMotion: "reduce" })
    await expect.poll(() => changes(first)).toBe(0)
    await page.emulateMedia({ reducedMotion: "no-preference" })
    await expect.poll(() => changes(first)).toBeGreaterThan(0)
  })
}
