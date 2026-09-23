import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test("configured grid columns switch after the wide layout becomes too small", async ({
  page,
}) => {
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({
        state: {
          items: ["One", "Two", "Three", "Four"].map((name, index) => ({
            id: `tab-${index}`,
            kind: "tab",
            name,
            url: `https://example.com/${index}`,
            size: "small",
            color: "#3478f6",
          })),
          layouts: {},
          mockDataVersion: 0,
        },
        version: 1,
      })
    )
  })
  await page.goto("/")

  const track = page.locator("[data-tab-grid-track]")
  await expect(track).toHaveAttribute("data-grid-component-columns", "4")
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(16)
  const desktop = await track.evaluate((node) => {
    const bounds = node.getBoundingClientRect()
    const parent = node.parentElement!.getBoundingClientRect()
    const effect = node.querySelector<HTMLElement>("[data-effect-style] > div")!
    return {
      offsetWidth: (node as HTMLElement).offsetWidth,
      renderedWidth: bounds.width,
      parentWidth: parent.width,
      scale: Number((node as HTMLElement).dataset.gridScale),
      effectOffsetWidth: effect.offsetWidth,
      effectRenderedWidth: effect.getBoundingClientRect().width,
    }
  })
  expect(desktop.offsetWidth).toBe(1192)
  expect(desktop.renderedWidth).toBeLessThanOrEqual(desktop.parentWidth)
  expect(desktop.renderedWidth / desktop.offsetWidth).toBeCloseTo(
    desktop.scale,
    3
  )
  expect(desktop.effectRenderedWidth / desktop.effectOffsetWidth).toBeCloseTo(
    desktop.scale,
    2
  )
  await expect
    .poll(() =>
      track.locator("[data-grid-item-id]").evaluateAll((nodes) => {
        const tiles = nodes.map((node) => node.getBoundingClientRect())
        return {
          rows: new Set(tiles.map((tile) => Math.round(tile.top))).size,
          columns: new Set(tiles.map((tile) => Math.round(tile.left))).size,
        }
      })
    )
    .toEqual({ rows: 1, columns: 4 })
  await page.setViewportSize({ width: 1000, height: 900 })
  await expect(track).toHaveAttribute("data-grid-component-columns", "2")
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(8)
  await expect
    .poll(() =>
      track.locator("[data-grid-item-id]").evaluateAll((nodes) => {
        const tiles = nodes.map((node) => node.getBoundingClientRect())
        return {
          rows: new Set(tiles.map((tile) => Math.round(tile.top))).size,
          columns: new Set(tiles.map((tile) => Math.round(tile.left))).size,
        }
      })
    )
    .toEqual({ rows: 2, columns: 2 })
  await expect
    .poll(async () => {
      const grid = await track.boundingBox()
      const search = await page.locator('[data-tour="search"]').boundingBox()
      return grid && search
        ? Math.max(
            Math.abs(grid.x - search.x),
            Math.abs(grid.x + grid.width - (search.x + search.width))
          )
        : Number.POSITIVE_INFINITY
    })
    .toBeLessThan(0.5)

  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  await settings.getByRole("button", { name: "主页", exact: true }).click()
  const wideColumnsInfo = settings.getByRole("button", {
    name: "宽屏列数说明",
  })
  await wideColumnsInfo.hover()
  await expect(
    page.getByText("空间充足时使用的组件列数。", { exact: true })
  ).toBeVisible()
  await settings.getByLabel("宽屏列数", { exact: true }).click()
  await page.getByRole("option", { name: "5 列", exact: true }).click()
  await settings.getByLabel("窄屏列数", { exact: true }).click()
  await page.getByRole("option", { name: "3 列", exact: true }).click()
  await settings.getByRole("button", { name: "关闭", exact: true }).click()

  await page.setViewportSize({ width: 1920, height: 1000 })
  await expect(track).toHaveAttribute("data-grid-component-columns", "5")
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(20)
  await expect
    .poll(
      async () =>
        await readStoredState<{
          wideGridColumns: number
          narrowGridColumns: number
        }>(page, "omt.home-settings")
    )
    .toMatchObject({ wideGridColumns: 5, narrowGridColumns: 3 })

  await page.setViewportSize({ width: 1000, height: 900 })
  await expect(track).toHaveAttribute("data-grid-component-columns", "3")
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(12)
  await expect
    .poll(async () => {
      const grid = await track.boundingBox()
      const search = await page.locator('[data-tour="search"]').boundingBox()
      return grid && search
        ? {
            centered: Math.abs(
              grid.x + grid.width / 2 - (search.x + search.width / 2)
            ),
            searchNoWider: search.width <= grid.width,
          }
        : null
    })
    .toEqual({ centered: 0, searchNoWider: true })

  await page.setViewportSize({ width: 390, height: 844 })
  await expect(track).toHaveAttribute("data-grid-component-columns", "3")
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(12)
  await expect
    .poll(async () => {
      const grid = await track.boundingBox()
      const search = await page.locator('[data-tour="search"]').boundingBox()
      return grid && search
        ? Math.max(
            Math.abs(grid.x - search.x),
            Math.abs(grid.x + grid.width - (search.x + search.width))
          )
        : Number.POSITIVE_INFINITY
    })
    .toBeLessThan(0.5)
  const mobileScale = Number(await track.getAttribute("data-grid-scale"))
  const firstTile = track.locator('[data-grid-item-id="tab-0"]')
  await firstTile.focus()
  await page.keyboard.press("Space")
  const overlay = page.locator("[data-tab-grid-overlay]")
  await expect(overlay).toBeVisible()
  const overlayScale = await overlay
    .locator(":scope > div")
    .evaluate((node) => {
      const element = node as HTMLElement
      return element.getBoundingClientRect().width / element.offsetWidth
    })
  expect(overlayScale).toBeCloseTo(mobileScale, 2)
  await page.reload()
  await expect(overlay).toHaveCount(0)
  await expect(track).toHaveAttribute("data-grid-component-columns", "3")
  await expect
    .poll(() =>
      track.locator("[data-grid-item-id]").evaluateAll((nodes) => {
        const tiles = nodes.map((node) => node.getBoundingClientRect())
        return {
          rows: new Set(tiles.map((tile) => Math.round(tile.top))).size,
          columns: new Set(tiles.map((tile) => Math.round(tile.left))).size,
        }
      })
    )
    .toEqual({ rows: 2, columns: 3 })
})
