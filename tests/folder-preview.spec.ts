import { expect, test } from "@playwright/test"

for (const size of ["large", "tall"] as const) {
  test(`${size} folder fills its available height with complete rows`, async ({
    page,
  }) => {
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
    const count = await region.evaluate((element) => {
      const row = element.querySelector("[data-stack-row]")!
      const height =
        element.clientHeight - parseFloat(getComputedStyle(element).paddingTop)
      return Math.min(
        10,
        Math.floor((height + 8) / (row.getBoundingClientRect().height + 8))
      )
    })
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
    await expect
      .poll(async () => {
        const first = (await links.nth(0).boundingBox())!
        const second = (await links.nth(1).boundingBox())!
        return Math.abs(first.y - second.y) < 1 && second.x > first.x
      })
      .toBe(true)
    await page.setViewportSize({ width: 390, height: 969 })
    await expect
      .poll(async () => {
        const first = (await links.nth(0).boundingBox())!
        const second = (await links.nth(1).boundingBox())!
        return Math.abs(first.x - second.x) < 1 && second.y > first.y
      })
      .toBe(true)
    await expanded.getByRole("button", { name: "关闭文件夹" }).click()
    await expect(expanded).toHaveCount(0)
    await region.focus()
    await region.press("End")
    await expect(
      region.getByRole("link", { name: "网站 10", exact: true })
    ).toBeVisible()
  })
}

test("legacy compact folders retain bookmarks and use the standard size", async ({
  page,
}) => {
  await page.addInitScript(() => {
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
              id: "legacy",
              kind: "folder",
              name: "已有收藏",
              size: "small",
              color: "#3478f6",
              tabs: [
                { id: "saved", name: "保留的网站", url: "https://example.com" },
              ],
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  await expect(
    page.getByRole("link", { name: "保留的网站", exact: true })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          JSON.parse(localStorage.getItem("omt.tab-grid")!).state.items.find(
            (item: { id: string }) => item.id === "legacy"
          ).size
      )
    )
    .toBe("large")
  await page.locator('[data-grid-item-id="legacy"]').click({ button: "right" })
  await expect(
    page.getByRole("menuitemradio", { name: "小 · 4×2", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("menuitemradio", { name: "大 · 4×4", exact: true })
  ).toBeVisible()
})

for (const size of ["wide", "wide-tall"]) {
  test(`${size} folder spans eight cells and arranges bookmarks in two columns`, async ({ page }) => {
    await page.addInitScript((size) => {
      localStorage.setItem("omt.onboarding", JSON.stringify({ state: { seen: true }, version: 0 }))
      localStorage.setItem("omt.tab-grid", JSON.stringify({ state: { items: [{ id: "wide-folder", kind: "folder", name: "双列", size, color: "#3478f6", tabs: Array.from({length: 20}, (_, i) => ({id: String(i), name: `链接 ${i}`, url: `https://example.com/${i}`})) }], layouts: {} }, version: 0 }))
    }, size)
    await page.goto("/")
    const folder = page.locator('[data-grid-item-id="wide-folder"]')
    await expect(folder).toHaveCSS("grid-column-end", "span 8")
    const links = folder.getByRole("link")
    await expect.poll(async () => {
      const a = await links.nth(0).boundingBox(), b = await links.nth(1).boundingBox()
      return !!a && !!b && Math.abs(a.y-b.y) < 1 && b.x > a.x
    }).toBe(true)
    await page.reload()
    await expect(folder).toHaveCSS("grid-column-end", "span 8")
    await page.setViewportSize({width: 375, height: 900})
    await expect(folder).toHaveCSS("grid-column-end", "span 4")
    await expect.poll(async () => {
      const a = await links.nth(0).boundingBox(), b = await links.nth(1).boundingBox()
      return !!a && !!b && Math.abs(a.x-b.x) < 1 && b.y > a.y
    }).toBe(true)
  })
}
