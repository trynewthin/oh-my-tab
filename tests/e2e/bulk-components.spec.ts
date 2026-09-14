import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

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
              id: "a",
              kind: "tab",
              name: "甲",
              url: "https://example.com/a",
              color: "#6c8bd4",
              size: "small",
            },
            {
              id: "b",
              kind: "tab",
              name: "乙",
              url: "https://example.com/b",
              color: "#6c8bd4",
              size: "small",
            },
            {
              id: "folder",
              kind: "folder",
              name: "资料",
              color: "#6c8bd4",
              size: "large",
              tabs: [
                {
                  id: "child",
                  name: "子书签",
                  url: "https://example.com/child",
                },
              ],
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "批量操作", exact: true }).click()
})

test("bulk delete supports cancellation and a single undo", async ({
  page,
}) => {
  await page.getByRole("checkbox", { name: "选择甲", exact: true }).click()
  await page.getByRole("checkbox", { name: "选择资料", exact: true }).click()
  const bar = page.getByRole("toolbar", { name: "批量操作" })
  await bar.getByRole("button", { name: "删除", exact: true }).click()
  let dialog = page.getByRole("dialog", { name: "删除组件", exact: true })
  await dialog.getByRole("button", { name: "取消", exact: true }).click()
  await expect(
    page.getByRole("checkbox", { name: "选择甲", exact: true })
  ).toBeChecked()
  await bar.getByRole("button", { name: "删除", exact: true }).click()
  dialog = page.getByRole("dialog", { name: "删除组件", exact: true })
  await dialog.getByRole("button", { name: "确认删除", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "乙", exact: true })
  ).toBeVisible()
  await expect(page.getByRole("link", { name: "甲", exact: true })).toHaveCount(
    0
  )
  await page.getByRole("button", { name: "撤销", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "甲", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "子书签", exact: true })
  ).toBeVisible()
})

test("one folder and tabs move into the existing folder", async ({ page }) => {
  await page.getByRole("checkbox", { name: "选择甲", exact: true }).click()
  await page.getByRole("checkbox", { name: "选择资料", exact: true }).click()
  await page.getByRole("button", { name: "成组", exact: true }).click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "资料", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "乙", exact: true })
  ).toBeVisible()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        items: { id: string; name: string; tabs?: { id: string }[] }[]
      }>(page, "omt.tab-grid")
      return {
        ids: state.items.map((item) => item.id),
        tabIds:
          state.items
            .find((item) => item.name === "资料")
            ?.tabs?.map((tab) => tab.id) ?? [],
      }
    })
    .toEqual({ ids: ["b", "folder"], tabIds: ["child", "a"] })
})

test("selected tabs create a named folder", async ({ page }) => {
  await page.getByRole("checkbox", { name: "选择甲", exact: true }).click()
  await page.getByRole("checkbox", { name: "选择乙", exact: true }).click()
  await page.getByRole("button", { name: "成组", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "文件夹名称", exact: true })
  await dialog.getByLabel("文件夹名称").fill("项目")
  await dialog.getByRole("button", { name: "确认成组", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "项目", exact: true })
  ).toBeVisible()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        items: { name: string; tabs?: { id: string }[] }[]
      }>(page, "omt.tab-grid")
      return {
        count: state.items.length,
        tabIds:
          state.items
            .find((item) => item.name === "项目")
            ?.tabs?.map((tab) => tab.id) ?? [],
      }
    })
    .toEqual({ count: 2, tabIds: ["a", "b"] })
})

test("selection toolbar works on mobile and exits cleanly", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 812 })
  const bar = page.getByRole("toolbar", { name: "批量操作" })
  await expect(
    bar.getByRole("button", { name: "成组", exact: true })
  ).toBeVisible()
  await expect(
    bar.getByRole("button", { name: "删除", exact: true })
  ).toBeInViewport()
  await expect(
    bar.getByRole("button", { name: "完成", exact: true })
  ).toBeVisible()
  await bar.getByRole("button", { name: "完成", exact: true }).click()
  await expect(bar).toHaveCount(0)
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await expect(
    page.getByRole("button", { name: "批量操作", exact: true })
  ).toHaveAttribute("aria-pressed", "false")
})
