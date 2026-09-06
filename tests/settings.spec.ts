import { expect, test } from "@playwright/test"

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
  await dialog.getByRole("button", { name: "搜索引擎", exact: true }).click()
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
  await dialog.getByRole("button", { name: "主页设置", exact: true }).click()
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
  await dialog.getByRole("button", { name: "选择主题色", exact: true }).click()
  await page.getByLabel("主题色", { exact: true }).fill("#a855f7")
  await page.keyboard.press("Escape")
  await dialog.getByRole("button", { name: "主页设置", exact: true }).click()
  await dialog.getByLabel("点阵显示内容").click()
  await page.getByRole("option", { name: "字符", exact: true }).click()
  await dialog.getByLabel("显示字符").fill("HELLO中文 2026")
  await expect(dialog.getByLabel("显示字符")).toHaveValue("HELLO 2026")
  await page.reload()
  await expect(
    page.getByRole("img", { name: "HELLO 2026", exact: true })
  ).toBeVisible()
  await expect
    .poll(() =>
      page.evaluate(
        () => JSON.parse(localStorage.getItem("omt.home-settings")!).state.color
      )
    )
    .toBe("#a855f7")
})

test("clipboard failure appears in toast while settings remain usable", async ({
  page,
}) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.clipboard, "readText", {
      value: async () => {
        throw new Error("Denied")
      },
    })
  )
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "常规设置", exact: true }).click()
  await dialog.getByRole("button", { name: "粘贴", exact: true }).click()
  await expect(page.getByRole("alert")).toHaveText(
    "无法读取剪贴板，请直接粘贴到输入框"
  )
  await expect(dialog.getByRole("alert")).toHaveCount(0)
  await page.getByRole("button", { name: "关闭通知", exact: true }).click()
  await expect(page.getByRole("alert")).toHaveCount(0)
  await expect(dialog).toBeVisible()
})

test("personalization persists global burning controls", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
  const amplitude = dialog.getByRole("slider", { name: "燃烧幅度" })
  await expect(amplitude).toHaveValue("1")
  await amplitude.focus()
  await amplitude.press("End")
  await expect(amplitude).toHaveValue("2")
  const entrance = dialog.getByRole("switch", { name: "过渡效果" })
  await expect(entrance).not.toBeChecked()
  await entrance.click()
  await expect(entrance).toBeChecked()
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
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
