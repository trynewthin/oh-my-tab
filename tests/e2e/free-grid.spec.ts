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
    .toBe(24)
  expect((24 / 4) % 2).toBe(0)
  await expect(page.getByRole("combobox", { name: "搜索" })).toHaveCount(1)
  await expect(page.getByRole("combobox", { name: "对话输入" })).toHaveCount(1)
  const minimalInput = page.getByRole("combobox", { name: "搜索" })
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
  expect((8 / 4) % 2).toBe(0)
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
  await page.getByRole("button", { name: "外观" }).click()
  await page.getByRole("button", { name: "自由网格" }).click()

  await expect(page.locator("[data-matrix-columns]")).toHaveCount(0)
  await expect(page.locator('[data-tour="search"]')).toHaveCount(0)
  await expect(page.locator('[data-tour="grid"]')).not.toHaveClass(
    /max-w-\[1280px\]/
  )
})
