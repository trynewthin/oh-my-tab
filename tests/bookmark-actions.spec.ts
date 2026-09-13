import { expect, test } from "@playwright/test"
import { readStoredState } from "./storage"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({
        state: {
          items: [
            {
              id: "existing",
              kind: "tab",
              name: "已有",
              url: "https://example.com/",
              size: "small",
              color: "#6c8bd4",
            },
            {
              id: "folder",
              kind: "folder",
              name: "开发",
              size: "large",
              color: "#6c8bd4",
              tabs: [
                { id: "child", name: "子书签", url: "https://child.example/" },
              ],
            },
          ],
          layouts: { 12: { existing: { x: 0, y: 0 }, folder: { x: 4, y: 0 } } },
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
})

test("folder deletion can be undone without undoing another deletion", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "开发", exact: true })
    .click({ button: "right" })
  await page.getByRole("menuitem", { name: "删除", exact: true }).click()
  await page.getByRole("menuitem", { name: /确认删除/ }).click()
  await expect(
    page.getByRole("button", { name: "开发", exact: true })
  ).toHaveCount(0)
  await page
    .getByRole("link", { name: "已有", exact: true })
    .click({ button: "right" })
  await page.getByRole("menuitem", { name: "删除", exact: true }).click()
  await page.getByRole("menuitem", { name: "确认删除", exact: true }).click()
  await page.getByRole("button", { name: "撤销", exact: true }).first().click()
  await expect(
    page.getByRole("button", { name: "开发", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "已有", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "子书签", exact: true })
  ).toBeVisible()
  const stored = await readStoredState<{
    layouts: Record<number, Record<string, { x: number; y: number }>>
  }>(page, "omt.tab-grid")
  expect(stored.layouts[12].folder).toEqual({ x: 4, y: 0 })
  await page.getByRole("button", { name: "撤销", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "已有", exact: true })
  ).toBeVisible()
})

test("browser bookmark import explains when extension access is unavailable", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.getByRole("button", { name: "常规", exact: true }).click()
  const importButton = page.getByRole("button", { name: "导入", exact: true })
  await expect(importButton).toBeDisabled()
  await page
    .getByRole("button", { name: "从浏览器书签导入说明", exact: true })
    .click()
  await expect(
    page
      .locator('[data-slot="popover-content"]')
      .getByText("请在 Chrome 或 Edge 扩展中导入浏览器书签。")
  ).toBeVisible()
})
