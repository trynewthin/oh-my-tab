import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  })
})

test("custom search engines validate URLs and persist selection", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "搜索", exact: true }).click()
  await dialog.getByRole("button", { name: "添加", exact: true }).click()
  const add = page.getByRole("dialog", { name: "添加搜索引擎", exact: true })
  await add.getByLabel("名称", { exact: true }).fill("Example Search")
  await add
    .getByLabel("搜索地址", { exact: true })
    .fill("javascript:alert('{query}')")
  await add.getByRole("button", { name: "保存", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await add
    .getByLabel("搜索地址", { exact: true })
    .fill("https://example.com/search?q={query}")
  await add.getByRole("button", { name: "保存", exact: true }).click()
  await dialog
    .getByRole("button", { name: "使用 Example Search", exact: true })
    .click()
  await dialog.getByRole("button", { name: "关闭", exact: true }).click()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        selectedId: string
        engines: { id: string; name: string }[]
      }>(page, "omt.search-engines")
      const engine = state.engines.find(
        (item) => item.name === "Example Search"
      )
      return engine?.id === state.selectedId
    })
    .toBe(true)
  await page.reload()
  await expect(
    page.getByRole("button", { name: "搜索引擎：Example Search", exact: true })
  ).toBeVisible()
})

test("personalization persists theme color and home settings filter unsupported text", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "顶部", exact: true }).click()
  await dialog.getByRole("button", { name: "外观", exact: true }).click()
  await dialog.getByRole("button", { name: "选择主题色", exact: true }).click()
  await page.getByLabel("主题色", { exact: true }).fill("#a855f7")
  await page.keyboard.press("Escape")
  await dialog.getByRole("button", { name: "顶部", exact: true }).click()
  await dialog.getByLabel("点阵显示内容").click()
  await page.getByRole("option", { name: "字符", exact: true }).click()
  await dialog.getByLabel("显示字符").fill("HELLO中文 2026")
  await expect(dialog.getByLabel("显示字符")).toHaveValue("HELLO 2026")
  await expect
    .poll(async () => {
      const state = await readStoredState<{ color: string; text: string }>(
        page,
        "omt.home-settings"
      )
      return { color: state.color, text: state.text }
    })
    .toEqual({ color: "#a855f7", text: "HELLO 2026" })
  await page.reload()
  await expect(
    page.getByRole("img", { name: "HELLO 2026", exact: true })
  ).toBeVisible()
  expect(
    (await readStoredState<{ color: string }>(page, "omt.home-settings")).color
  ).toBe("#a855f7")
})

test("personalization persists global burning controls", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "动效", exact: true }).click()
  const amplitude = dialog.getByRole("slider", { name: "燃烧幅度" })
  await expect(amplitude).toHaveValue("1")
  await amplitude.focus()
  await amplitude.press("End")
  await expect(amplitude).toHaveValue("2")
  const entrance = dialog.getByRole("switch", { name: "过渡效果" })
  await expect(entrance).not.toBeChecked()
  await entrance.click()
  await expect(entrance).toBeChecked()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        burningAmplitude: number
        transitionsEnabled: boolean
      }>(page, "omt.home-settings")
      return [state.burningAmplitude, state.transitionsEnabled]
    })
    .toEqual([2, true])
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await dialog.getByRole("button", { name: "动效", exact: true }).click()
  await expect(amplitude).toHaveValue("2")
  await expect(entrance).toBeChecked()
})

test("bookmark entrance settles into its saved static background", async ({
  page,
}) => {
  await page.clock.install()
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.home-settings",
      JSON.stringify({
        state: { transitionsEnabled: true, burningAmplitude: 1 },
        version: 0,
      })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({
        state: {
          items: [
            {
              id: "entry",
              kind: "tab",
              name: "入场",
              url: "https://example.com",
              size: "small",
              color: "#6c8bd4",
              dynamicEffect: false,
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const tile = page.locator('[data-grid-item-id="entry"]')
  await expect(tile.locator('[data-burning-entrance="running"]')).toHaveCount(1)
  await page.clock.runFor(1800)
  await expect(tile.locator('[data-burning-entrance="running"]')).toHaveCount(0)
  const pixels = () =>
    tile
      .locator("[data-burn-cell]")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLElement).style.backgroundColor)
      )
  const still = await pixels()
  expect(still.some((value) => value !== "transparent")).toBe(true)
  await page.clock.runFor(1000)
  expect(await pixels()).toEqual(still)
})
