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
  await expect(add.getByRole("alert")).toBeVisible()
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

test("home settings persist matrix color and filter unsupported text", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "主页设置", exact: true }).click()
  await dialog.getByLabel("点阵颜色").fill("#a855f7")
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
