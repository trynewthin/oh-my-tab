import { expect, test } from "@playwright/test"

for (const [size, expectedRows] of [
  ["large", 4],
  ["tall", 8],
] as const) {
  test(`${size} folder fills its height with ${expectedRows} complete rows`, async ({
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
                  tabs: Array.from({ length: 20 }, (_, i) => ({
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
    // The row pitch is measured from the live stack because the gap may shrink
    // slightly while each texture row stays aligned to whole 9px cells.
    const geometry = await region.evaluate((element) => {
      const available =
        element.clientHeight - parseFloat(getComputedStyle(element).paddingTop)
      const rows = Array.from(
        element.querySelectorAll<HTMLElement>("[data-stack-row]")
      )
      const rowHeight = rows[0]?.getBoundingClientRect().height ?? 0
      const step =
        rows.length > 1
          ? rows[1].getBoundingClientRect().top -
            rows[0].getBoundingClientRect().top
          : rowHeight
      const fitted =
        step > 0
          ? Math.max(
              1,
              Math.min(
                rows.length,
                Math.floor((available - rowHeight) / step + 1e-6) + 1
              )
            )
          : rows.length
      return { available, rowHeight, step, fitted, total: rows.length }
    })
    expect(geometry.fitted).toBe(expectedRows)
    expect((geometry.rowHeight - 1) % 9).toBeCloseTo(0, 5)
    await expect(region.getByRole("link")).toHaveCount(geometry.fitted)
    const bounds = (await region.boundingBox())!
    const boxes = await region
      .getByRole("link")
      .evaluateAll((elements) =>
        elements.map((element) => element.getBoundingClientRect())
      )
    expect(boxes).toHaveLength(geometry.fitted)
    // Every shown row must be complete: fully inside the region, never clipped
    // by its top or bottom edge.
    for (const box of boxes) {
      expect(box.top).toBeGreaterThanOrEqual(bounds.y - 0.5)
      expect(box.bottom).toBeLessThanOrEqual(bounds.y + bounds.height + 0.5)
    }
    // The stack must consume the available height: no further full row fits.
    const lowest = Math.max(...boxes.map((box) => box.bottom))
    expect(bounds.y + bounds.height - lowest).toBeLessThan(2)
    // Large and tall previews are multi-row, and their twenty bookmarks exceed
    // what fits, so the scroll path below is genuinely exercised.
    expect(geometry.fitted).toBeGreaterThan(1)
    expect(geometry.fitted).toBeLessThan(geometry.total)
    await page.getByRole("button", { name: "资料", exact: true }).click()
    const expanded = page.getByRole("dialog", { name: "资料", exact: true })
    const expandedGrid = expanded.locator("[data-expanded-folder-grid]")
    await expect(
      expandedGrid.locator("[data-stack-row]").first()
    ).not.toHaveCSS("position", "fixed")
    // Expanded folders use the same grid geometry as expanded todos.
    const columnCount = () =>
      expandedGrid.evaluate(
        (element) =>
          getComputedStyle(element).gridTemplateColumns.split(" ").length
      )
    await expect.poll(columnCount).toBe(3)
    const expandedTab = (await expandedGrid
      .locator("[data-stack-row]")
      .first()
      .boundingBox())!
    expect(expandedTab.height).toBeCloseTo(48, 1)
    await expect
      .poll(() =>
        expandedGrid.locator("[data-stack-row]").evaluateAll((rows) =>
          rows.slice(0, 4).map((row) => {
            const effect = row.querySelector<HTMLElement>("[data-effect-style]")
            const cell = effect?.querySelector<HTMLElement>("[data-burn-cell]")
            if (!effect || !cell) return null
            return (
              cell.getBoundingClientRect().top -
              effect.getBoundingClientRect().top
            )
          })
        )
      )
      .toEqual([0, 0, 0, 0])
    await page.setViewportSize({ width: 390, height: 969 })
    await expect.poll(columnCount).toBe(2)
    await page.setViewportSize({ width: 1440, height: 1000 })
    await expect.poll(columnCount).toBe(3)
    const folder = page.locator('[data-grid-item-id="folder"]')
    const content = expanded.locator("[data-expansion-content]")
    await expanded.getByRole("button", { name: "关闭文件夹" }).click()
    await expect(content).toHaveCSS("opacity", "1")
    await expect(expandedGrid).toHaveAttribute("data-collapsing", "true")
    await expect(expandedGrid.locator("[data-stack-row]").nth(1)).toHaveCSS(
      "position",
      "fixed"
    )
    await expect(expandedGrid).toHaveCSS(
      "grid-template-columns",
      /\d+(\.\d+)?px \d+(\.\d+)?px/
    )
    await expect(expanded).toHaveCount(0)
    await expect(folder).toHaveCSS("visibility", "visible")
    await region.focus()
    await region.press("End")
    await expect(
      region.getByRole("link", { name: "网站 20", exact: true })
    ).toBeVisible()
  })
}

test("legacy compact folders retain bookmarks and their stored size", async ({
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
    .toBe("small")
})

for (const [size, expectedRows] of [
  ["wide", 4],
  ["wide-tall", 8],
] as const) {
  test(`${size} folder keeps two columns on the minimum-width grid`, async ({
    page,
  }) => {
    await page.addInitScript((size) => {
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
                id: "wide-folder",
                kind: "folder",
                name: "双列",
                size,
                color: "#3478f6",
                tabs: Array.from({ length: 20 }, (_, i) => ({
                  id: String(i),
                  name: `链接 ${i}`,
                  url: `https://example.com/${i}`,
                })),
              },
            ],
            layouts: {},
          },
          version: 0,
        })
      )
    }, size)
    await page.goto("/")
    const folder = page.locator('[data-grid-item-id="wide-folder"]')
    await expect(folder).toHaveCSS("grid-column-end", "span 8")
    const links = folder.getByRole("link")
    await expect(links).toHaveCount(expectedRows * 2)
    await expect
      .poll(async () => {
        const a = await links.nth(0).boundingBox(),
          b = await links.nth(1).boundingBox()
        return !!a && !!b && Math.abs(a.y - b.y) < 1 && b.x > a.x
      })
      .toBe(true)
    await page.reload()
    await expect(folder).toHaveCSS("grid-column-end", "span 8")
    await page.setViewportSize({ width: 375, height: 900 })
    await expect(folder).toHaveCSS("grid-column-end", "span 8")
    await expect(links).toHaveCount(expectedRows * 2)
    await expect
      .poll(async () => {
        const a = await links.nth(0).boundingBox(),
          b = await links.nth(1).boundingBox()
        return !!a && !!b && Math.abs(a.y - b.y) < 1 && b.x > a.x
      })
      .toBe(true)
  })
}
