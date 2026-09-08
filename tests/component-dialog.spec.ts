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

test("component picker lists widgets and more menu creates editable bookmarks", async ({
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
  await expect(
    catalog.getByRole("button", { name: "添加标签", exact: true })
  ).toHaveCount(0)
  await expect(
    catalog.getByRole("button", { name: "添加文件夹", exact: true })
  ).toHaveCount(0)
  await expect(
    catalog.getByRole("button", { name: "选择点阵画布" })
  ).toBeVisible()
  await expect(
    catalog.getByRole("button", { name: "选择像素花盆" })
  ).toBeVisible()
  await page.keyboard.press("Escape")
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加标签", exact: true }).click()
  const creation = page.getByRole("dialog", { name: "配置标签", exact: true })
  await creation.getByLabel("名称", { exact: true }).fill("我的书签")
  await creation
    .getByLabel("网址", { exact: true })
    .fill("https://example.com/")
  await creation.getByRole("button", { name: "确认添加", exact: true }).click()
  const bookmark = page.getByRole("link", { name: "我的书签", exact: true })
  await expect(bookmark).toBeVisible()
  await bookmark.click({ button: "right" })
  await expect(
    page.getByRole("menuitem", { name: "添加组件", exact: true })
  ).toHaveCount(0)
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click()
  const editor = page.getByRole("dialog", { name: "编辑标签", exact: true })
  await expect(editor.getByLabel("名称", { exact: true })).toHaveValue(
    "我的书签"
  )
  await editor.getByLabel("名称", { exact: true }).fill("文档")
  await editor
    .getByLabel("网址", { exact: true })
    .fill("https://example.com/docs")
  await editor.getByRole("button", { name: "保存", exact: true }).click()
  await page.reload()
  await expect(
    page.getByRole("link", { name: "文档", exact: true })
  ).toHaveAttribute("href", "https://example.com/docs")
})

test("more menu creates folders on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加文件夹", exact: true }).click()
  const creation = page.getByRole("dialog", { name: "配置文件夹", exact: true })
  await creation.getByRole("button", { name: "取消", exact: true }).click()
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加文件夹", exact: true }).click()
  await creation.getByLabel("名称", { exact: true }).fill("文件夹")
  await creation.getByRole("button", { name: "确认添加", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "文件夹", exact: true })
  ).toBeVisible()
  await page.reload()
  await expect(
    page.getByRole("button", { name: "文件夹", exact: true })
  ).toBeVisible()
})

test("dot canvas catalog preview keeps square proportions", async ({
  page,
}) => {
  await page.getByRole("button", { name: "更多操作" }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  const preview = page
    .getByRole("button", { name: "选择点阵画布" })
    .getByRole("img", { name: "点阵画布" })
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 969 })
    await expect
      .poll(async () => {
        const box = (await preview.boundingBox())!
        return Math.abs(box.width - box.height)
      })
      .toBeLessThan(1)
  }
})
