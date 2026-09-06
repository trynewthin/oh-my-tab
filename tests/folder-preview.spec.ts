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
    await page.getByRole("button", { name: "资料", exact: true }).click()
    const expanded = page.getByRole("dialog", { name: "资料", exact: true })
    const links = expanded.getByRole("link")
    await expect.poll(async () => {
      const first = (await links.nth(0).boundingBox())!
      const second = (await links.nth(1).boundingBox())!
      return Math.abs(first.y - second.y) < 1 && second.x > first.x
    }).toBe(true)
    await page.setViewportSize({ width: 390, height: 969 })
    await expect.poll(async () => {
      const first = (await links.nth(0).boundingBox())!
      const second = (await links.nth(1).boundingBox())!
      return Math.abs(first.x - second.x) < 1 && second.y > first.y
    }).toBe(true)
    await expanded.getByRole("button", { name: "关闭文件夹" }).click()
    await expect(expanded).toHaveCount(0)
    await region.focus()
    await region.press("End")
    await expect(
      region.getByRole("link", { name: "网站 10", exact: true })
    ).toBeVisible()
  })
}
