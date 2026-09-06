import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  )
  await page.goto("/")
})

test("empty grid context menu opens component picker and saves a bookmark", async ({
  page,
}) => {
  await page
    .getByRole("region", { name: "标签网格", exact: true })
    .click({ button: "right", position: { x: 30, y: 100 } })
  await page.getByRole("menuitem", { name: "添加组件", exact: true }).click()
  const catalog = page.getByRole("dialog", { name: "组件", exact: true })
  await expect(catalog).toBeVisible()
  await expect
    .poll(async () => Math.round((await catalog.boundingBox())!.width))
    .toBe(768)
  await expect(catalog.getByLabel("名称", { exact: true })).toHaveCount(0)
  await catalog.getByRole("button", { name: "添加标签", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "配置标签", exact: true })
  await dialog.getByLabel("名称", { exact: true }).fill("文档")
  await dialog
    .getByLabel("网址", { exact: true })
    .fill("https://example.com/docs")
  await dialog.getByRole("button", { name: "确认添加", exact: true }).click()
  const bookmark = page.getByRole("link", { name: "文档", exact: true })
  await expect(bookmark).toBeVisible()
  await bookmark.click({ button: "right" })
  await expect(
    page.getByRole("menuitem", { name: "添加组件", exact: true })
  ).toHaveCount(0)
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click()
  await expect(
    page
      .getByRole("dialog", { name: "编辑标签", exact: true })
      .getByLabel("名称", { exact: true })
  ).toHaveValue("文档")
})

test("more menu opens the picker and folder creation works on mobile", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  const catalog = page.getByRole("dialog", { name: "组件", exact: true })
  await catalog.getByRole("button", { name: "添加文件夹", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "配置文件夹", exact: true })
  await dialog.getByRole("button", { name: "取消", exact: true }).click()
  await expect(catalog).toBeVisible()
  await catalog.getByRole("button", { name: "添加文件夹", exact: true }).click()
  await dialog.getByLabel("名称", { exact: true }).fill("收藏")
  await expect(dialog.getByLabel("网址", { exact: true })).toHaveCount(0)
  await dialog.getByRole("button", { name: "确认添加", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "收藏", exact: true })
  ).toBeVisible()
})
