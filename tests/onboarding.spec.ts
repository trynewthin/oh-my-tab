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
    tour.getByRole("heading", { name: "四宫格：更多操作" })
  ).toBeVisible()
  await tour.getByRole("button", { name: "上一步" }).click()
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  const titles: string[] = []
  for (let i = 0; i < 20; i++) {
    titles.push(await tour.getByRole("heading").innerText())
    const next = tour.getByRole("button", { name: "下一步" })
    if (!(await next.count())) break
    await next.click()
  }
  expect(titles).toContain("组件：预览、配置与添加")
  expect(titles).toContain("批量操作：成组与删除")
  expect(titles).toContain("个性化：主题色与燃烧")
  expect(titles.at(-1)).toBe("随时重看教程")
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
    page.getByRole("button", { name: "更多操作", exact: true })
  ).toBeVisible()
})
