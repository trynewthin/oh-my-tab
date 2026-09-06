import { expect, test } from "@playwright/test"

for (const [size, count] of [
  ["large", 4],
  ["tall", 8],
] as const) {
  test(`${size} folder shows ${count} complete rows`, async ({ page }) => {
    await page.addInitScript(
      ({ size }) => {
        localStorage.setItem(
          "omt.onboarding",
          JSON.stringify({ state: { seen: true }, version: 0 })
        )
        localStorage.setItem(
          "omt.tab-grid",
          JSON.stringify({
            state: {
              items: [
                {
                  id: "folder",
                  kind: "folder",
                  name: "资料",
                  size,
                  color: "#6c8bd4",
                  tabs: Array.from({ length: 10 }, (_, i) => ({
                    id: String(i),
                    name: `网站 ${i + 1}`,
                    url: `https://example.com/${i}`,
                  })),
                },
              ],
              layouts: {},
            },
            version: 0,
          })
        )
      },
      { size }
    )
    await page.goto("/")
    const region = page.getByRole("region", { name: "资料内的标签" })
    await expect(region).toBeVisible()
    await expect(region.getByRole("link")).toHaveCount(count)
    const bounds = await region.boundingBox()
    for (const link of await region.getByRole("link").all()) {
      const box = await link.boundingBox()
      expect(box!.y).toBeGreaterThanOrEqual(bounds!.y)
      expect(box!.y + box!.height).toBeLessThanOrEqual(
        bounds!.y + bounds!.height
      )
    }
    await region.focus()
    await region.press("End")
    await expect(
      region.getByRole("link", { name: "网站 10", exact: true })
    ).toBeVisible()
  })
}
