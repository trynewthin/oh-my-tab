import { expect, test } from "@playwright/test"

test("first visit tour completes and can be replayed from settings", async ({
  page,
}) => {
  await page.goto("/")
  const tour = page.getByRole("dialog")
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  await expect(tour.getByRole("button", { name: "上一步" })).toBeDisabled()
  await tour.getByRole("button", { name: "下一步" }).click()
  await expect(
    tour.getByRole("heading", { name: "加号：添加标签或文件夹" })
  ).toBeVisible()
  await tour.getByRole("button", { name: "上一步" }).click()
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  for (let i = 0; i < 10; i++)
    await tour.getByRole("button", { name: "下一步" }).click()
  await tour.getByRole("button", { name: "开始使用" }).click()
  await expect(tour).toHaveCount(0)
  await page.reload()
  await expect(tour).toHaveCount(0)
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.getByRole("button", { name: "常规设置", exact: true }).click()
  await page.getByRole("button", { name: "重新开始教程" }).click()
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  await expect(
    page.getByRole("dialog", { name: "设置", exact: true })
  ).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(tour).toHaveCount(0)
  await page.reload()
  await expect(tour).toHaveCount(0)
})

test("skip persists on a narrow screen without changing user content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto("/")
  const next = page.getByRole("button", { name: "下一步" })
  await expect(next).toBeInViewport()
  await page.getByRole("button", { name: "跳过教程" }).click()
  await page.reload()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "添加标签或文件夹", exact: true })
  ).toBeVisible()
})
