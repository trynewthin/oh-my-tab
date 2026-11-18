import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test("calendar can be added, navigated, edited and restored", async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date(2024, 1, 29, 12))
  await page.addInitScript(() =>
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  )
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  await page.getByRole("button", { name: "效率", exact: true }).click()
  await page.getByRole("button", { name: "选择日历", exact: true }).click()
  const detail = page.getByRole("dialog", { name: "日历", exact: true })
  await detail.getByRole("button", { name: "4×4", exact: true }).click()
  await detail.getByRole("button", { name: "添加", exact: true }).click()
  await expect(page.locator('[data-app-window="components"]')).toHaveCount(0)
  const calendar = page.getByRole("region", { name: "日历", exact: true })
  await expect(calendar.getByRole("heading")).toHaveText("2024年2月")
  await expect(calendar.locator('[aria-current="date"]')).toHaveText("29")
  await calendar.getByRole("button", { name: "上个月" }).click()
  await calendar.getByRole("button", { name: "上个月" }).click()
  await expect(calendar.getByRole("heading")).toHaveText("2023年12月")
  await calendar.getByRole("button", { name: "今天", exact: true }).click()
  await expect(calendar.getByRole("heading")).toHaveText("2024年2月")
  await calendar.click({ button: "right" })
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click()
  const editor = page.getByRole("dialog", { name: "编辑日历", exact: true })
  await expect(editor.getByLabel("名称", { exact: true })).toHaveCount(0)
  await editor.getByRole("button", { name: "关闭", exact: true }).click()
  await expect
    .poll(async () => {
      const { items } = await readStoredState<{
        items: { kind: string; name: string }[]
      }>(page, "omt.tab-grid")
      return items.find((item) => item.kind === "calendar")?.name
    })
    .toBe("日历")
  await page.reload()
  await expect(
    page.getByRole("region", { name: "日历", exact: true })
  ).toBeVisible()
  await page.setViewportSize({ width: 390, height: 844 })
  const mobile = page.getByRole("region", { name: "日历", exact: true })
  expect(
    await mobile.evaluate((node) => node.scrollWidth <= node.clientWidth)
  ).toBe(true)
})
