import { expect, test, type Locator } from "@playwright/test"
import sharp from "sharp"
import { readStoredState } from "../helpers/storage"

async function expectCatalogPreviews(catalog: Locator, count: number) {
  const stages = catalog.locator("[data-catalog-preview-stage]")
  await expect(stages).toHaveCount(count)
  const metrics = await stages.evaluateAll((nodes) =>
    nodes.map((node) => {
      const stage = node.getBoundingClientRect()
      const content = node
        .querySelector("[data-catalog-preview-content]")!
        .getBoundingClientRect()
      return {
        height: Math.round(stage.height),
        contained:
          content.left >= stage.left - 1 &&
          content.right <= stage.right + 1 &&
          content.top >= stage.top - 1 &&
          content.bottom <= stage.bottom + 1,
      }
    })
  )
  expect(new Set(metrics.map((entry) => entry.height)).size).toBe(1)
  expect(metrics.every((entry) => entry.contained)).toBe(true)
}

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
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
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
  await expectCatalogPreviews(catalog, 3)
  await catalog.getByRole("button", { name: "效率", exact: true }).click()
  await expectCatalogPreviews(catalog, 5)
  await expect(
    catalog.getByRole("button", { name: "选择番茄钟" })
  ).toBeVisible()
  await expect(
    catalog.getByRole("button", { name: "选择倒数日" })
  ).toBeVisible()
  await expect(
    catalog.getByRole("button", { name: "选择下班倒计时" })
  ).toBeVisible()
  await catalog.getByRole("button", { name: "点阵", exact: true }).click()
  await expectCatalogPreviews(catalog, 1)
  await expect(
    catalog.getByRole("button", { name: "选择点阵画布" })
  ).toBeVisible()
  await catalog.getByRole("button", { name: "趣味", exact: true }).click()
  await expectCatalogPreviews(catalog, 1)
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
  await expect(
    page.getByRole("menuitem", { name: "刷新图标", exact: true })
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
  await editor.locator('input[type="file"]').setInputFiles({
    name: "icon.png",
    mimeType: "image/png",
    buffer: await sharp({
      create: {
        width: 96,
        height: 64,
        channels: 4,
        background: "#8b7cc8",
      },
    })
      .png()
      .toBuffer(),
  })
  const cropIcon = page.getByRole("dialog", {
    name: "裁剪图标",
    exact: true,
  })
  await expect(cropIcon).toBeVisible()
  await cropIcon.getByRole("button", { name: "确认裁剪", exact: true }).click()
  await expect(cropIcon).not.toBeVisible()
  const refreshIcon = editor.getByRole("button", {
    name: "刷新",
    exact: true,
  })
  await expect(refreshIcon).toBeEnabled()
  await refreshIcon.click()
  const replaceIcon = page.getByRole("alertdialog", {
    name: "替换自定义图标？",
    exact: true,
  })
  await expect(replaceIcon).toBeVisible()
  await replaceIcon.getByRole("button", { name: "取消", exact: true }).click()
  await editor.getByRole("button", { name: "保存", exact: true }).click()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        items: { name: string; url?: string; icon?: string }[]
      }>(page, "omt.tab-grid")
      const item = state.items.find((item) => item.name === "文档")
      return { url: item?.url, customIcon: item?.icon?.startsWith("data:") }
    })
    .toEqual({ url: "https://example.com/docs", customIcon: true })
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
  await expect
    .poll(async () => {
      const state = await readStoredState<{ items: { name: string }[] }>(
        page,
        "omt.tab-grid"
      )
      return state.items.some((item) => item.name === "文件夹")
    })
    .toBe(true)
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
  await page.getByRole("button", { name: "点阵", exact: true }).click()
  const preview = page
    .locator(".catalog-card")
    .filter({ has: page.getByRole("button", { name: "选择点阵画布" }) })
    .locator("svg[role=img]")
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
