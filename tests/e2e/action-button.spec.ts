import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  })
  await page.goto("/")
})

test("a 1×1 button can run and rebind system actions", async ({ page }) => {
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  const components = page.getByRole("dialog", { name: "组件", exact: true })
  await components
    .getByRole("button", { name: "选择按钮", exact: true })
    .click()
  await page.getByRole("button", { name: "添加", exact: true }).click()

  const tile = page.getByRole("group", { name: "拖动 按钮 放置", exact: true })
  const action = tile.getByRole("button", {
    name: "切换深浅色",
    exact: true,
  })
  await expect(action).toBeVisible()
  await action.click()
  await expect(page.locator("html")).toHaveClass(/dark/)

  await action.click({ button: "right" })
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click()
  const editor = page.getByRole("dialog", { name: "编辑按钮", exact: true })
  await editor.getByLabel("绑定行为", { exact: true }).click()
  await page.getByRole("option", { name: "打开设置", exact: true }).click()
  await editor.getByRole("button", { name: "保存", exact: true }).click()

  await tile.getByRole("button", { name: "打开设置", exact: true }).click()
  await expect(
    page.getByRole("dialog", { name: "设置", exact: true })
  ).toBeVisible()
})
