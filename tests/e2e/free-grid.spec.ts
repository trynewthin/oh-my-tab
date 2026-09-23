import { expect, test } from "@playwright/test"

const homeSettings = {
  layoutMode: "free",
  backgroundType: "solid",
  backgroundImage: null,
  backgroundPalette: "gray",
  searchBoxStyle: "full",
  folderStyle: "noise",
  tabTexture: "burning",
  topComponent: "dot-matrix",
  content: "time",
  text: "HELLO WORLD",
  pet: "cat",
  color: "#3478f6",
  burningAmplitude: 1,
  transitionsEnabled: false,
}

test("free grid replaces the fixed header with responsive search components", async ({
  page,
}) => {
  await page.addInitScript(
    ({ settings }) => {
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
      localStorage.setItem(
        "omt.home-settings",
        JSON.stringify({ state: settings, version: 0 })
      )
      localStorage.setItem(
        "omt.tab-grid",
        JSON.stringify({
          state: {
            items: [
              {
                id: "minimal-search",
                kind: "search-minimal",
                name: "简约搜索框",
                size: "small",
                color: "#6c8bd4",
              },
              {
                id: "full-search",
                kind: "search-full",
                name: "普通搜索框",
                size: "medium",
                color: "#6c8bd4",
              },
            ],
            layouts: {},
          },
          version: 0,
        })
      )
    },
    { settings: homeSettings }
  )
  await page.goto("/")

  await expect(page.locator("[data-matrix-columns]")).toHaveCount(0)
  await expect(page.locator('[data-grid-item-id="minimal-search"]')).toHaveCSS(
    "grid-column-end",
    "span 12"
  )
  await expect(page.locator('[data-grid-item-id="full-search"]')).toHaveCSS(
    "grid-column-end",
    "span 12"
  )
  const track = page.locator("[data-tab-grid-track]")
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(16)
  const initialCellSize = await track.evaluate((node) =>
    parseFloat(getComputedStyle(node).gridTemplateColumns.split(" ")[0])
  )
  await expect(
    page.getByRole("combobox", { name: "搜索", exact: true })
  ).toHaveCount(2)
  await expect(page.getByRole("combobox", { name: "对话输入" })).toHaveCount(0)
  const minimalTile = page.locator('[data-grid-item-id="minimal-search"]')
  await expect(
    minimalTile.getByRole("button", { name: "更多操作", exact: true })
  ).toHaveCount(0)
  await expect(
    minimalTile.getByRole("button", { name: "打开设置", exact: true })
  ).toHaveCount(0)
  const engine = minimalTile.getByRole("button", {
    name: "搜索引擎：Google",
    exact: true,
  })
  await expect(engine).toBeVisible()
  const inputShell = minimalTile.locator("[data-search-input-shell]")
  await expect
    .poll(async () => {
      const shell = (await inputShell.boundingBox())!
      const selector = (await engine.boundingBox())!
      return (
        selector.x >= shell.x &&
        selector.x + selector.width <= shell.x + shell.width
      )
    })
    .toBe(true)
  const minimalInput = minimalTile.getByRole("combobox", { name: "搜索" })
  await minimalInput.fill("oh my tab")
  await expect(minimalInput).toHaveValue("oh my tab")

  await page.setViewportSize({ width: 500, height: 900 })
  await expect(page.locator('[data-grid-item-id="minimal-search"]')).toHaveCSS(
    "grid-column-end",
    "span 8"
  )
  await expect(page.locator('[data-grid-item-id="full-search"]')).toHaveCSS(
    "grid-column-end",
    "span 8"
  )
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(8)
  await expect
    .poll(() =>
      track.evaluate((node) =>
        parseFloat(getComputedStyle(node).gridTemplateColumns.split(" ")[0])
      )
    )
    .toBe(initialCellSize)

  await page.setViewportSize({ width: 700, height: 900 })
  await expect
    .poll(() =>
      track.evaluate(
        (node) => getComputedStyle(node).gridTemplateColumns.split(" ").length
      )
    )
    .toBe(8)
  await expect(track).toHaveCSS("column-gap", "16px")
  const alignment = await track.evaluate((node) => {
    const track = node.getBoundingClientRect()
    const parent = node.parentElement!.getBoundingClientRect()
    return {
      left: track.left - parent.left,
      right: parent.right - track.right,
    }
  })
  expect(Math.abs(alignment.left - alignment.right)).toBeLessThan(1)
})

test("personalization switches between traditional and free grid layouts", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  })
  await page.goto("/")
  await expect(page.locator("[data-matrix-columns]")).toHaveCount(1)
  await expect(page.locator('[data-tour="search"]')).toHaveCount(1)

  await page.getByRole("button", { name: "打开设置" }).click()
  await page.getByRole("button", { name: "主页" }).click()
  await page.getByRole("button", { name: "极简" }).click()

  const preview = page.getByRole("group", { name: "顶栏预览" })
  await expect(preview).toBeVisible()
  await expect(preview).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  await expect(preview).toHaveCSS("border-top-width", "0px")
  const layout = page.getByRole("button", { name: "极简" })
  const leftActions = page.getByRole("group", { name: "左侧操作栏" })
  expect((await preview.boundingBox())!.y).toBeGreaterThan(
    (await layout.boundingBox())!.y
  )
  expect((await preview.boundingBox())!.y).toBeLessThan(
    (await leftActions.boundingBox())!.y
  )

  await expect(page.locator("[data-matrix-columns]")).toHaveCount(0)
  await expect(page.locator('[data-tour="search"]')).toHaveCount(0)
  await expect(page.locator('[data-tour="grid"]')).not.toHaveClass(
    /max-w-\[1280px\]/
  )
})
