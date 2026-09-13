import { expect, test } from "@playwright/test"
import { readStoredState, waitForStorageWrites } from "./storage"

test("first visit tour completes and can be replayed from settings", async ({
  page,
}) => {
  await page.goto("/")
  const tour = page.getByRole("dialog")
  await expect(
    tour.getByRole("heading", { name: "欢迎使用 Oh My Tab" })
  ).toBeVisible()
  await expect(
    tour.getByRole("checkbox", { name: /启用搜索联想/ })
  ).not.toBeChecked()
  await expect(
    tour.getByRole("checkbox", { name: /下载网站图标/ })
  ).not.toBeChecked()
  await page.screenshot({ path: "artifacts/onboarding-privacy.png" })
  await expect(
    tour.getByRole("button", { name: "不同意", exact: true })
  ).toBeVisible()
  await tour.getByRole("button", { name: "我同意", exact: true }).click()
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  await tour.getByRole("button", { name: "上一步" }).click()
  await expect(
    tour.getByRole("heading", { name: "欢迎使用 Oh My Tab" })
  ).toBeVisible()
  const titles: string[] = []
  for (let i = 0; i < 20; i++) {
    titles.push(await tour.getByRole("heading", { level: 2 }).innerText())
    const next = tour.getByRole("button", { name: /^(下一步|我同意)$/ })
    if (!(await next.count())) break
    await next.click()
  }
  expect(titles).toContain("组件：预览与添加")
  expect(titles).toContain("批量操作：成组与删除")
  expect(titles).toContain("个性化：主题色与燃烧")
  expect(titles.at(-1)).toBe("随时重看教程")
  await tour.getByRole("button", { name: "开始使用" }).click()
  await expect(tour).toHaveCount(0)
  await waitForStorageWrites(page)
  await expect
    .poll(
      async () =>
        (await readStoredState<{ seen: boolean }>(page, "omt.onboarding")).seen
    )
    .toBe(true)
  await page.reload()
  await expect(tour).toHaveCount(0)
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.getByRole("button", { name: "常规", exact: true }).click()
  await page.getByRole("button", { name: "重新开始教程" }).click()
  await expect(
    tour.getByRole("heading", { name: "欢迎使用 Oh My Tab" })
  ).toBeVisible()
  await expect(
    page.getByRole("dialog", { name: "设置", exact: true })
  ).toHaveCount(0)
  await page.keyboard.press("Escape")
  await expect(tour).toHaveCount(0)
  await waitForStorageWrites(page)
  await expect
    .poll(
      async () =>
        (await readStoredState<{ seen: boolean }>(page, "omt.onboarding")).seen
    )
    .toBe(true)
  await page.reload()
  await expect(tour).toHaveCount(0)
})

test("skip persists on a narrow screen without changing user content", async ({
  page,
}) => {
  await page.setViewportSize({ width: 375, height: 667 })
  await page.goto("/")
  const next = page.getByRole("button", { name: "我同意", exact: true })
  await expect(next).toBeInViewport()
  await page.getByRole("button", { name: "跳过教程" }).click()
  await waitForStorageWrites(page)
  await expect
    .poll(
      async () =>
        (await readStoredState<{ seen: boolean }>(page, "omt.onboarding")).seen
    )
    .toBe(true)
  await page.reload()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await expect(
    page.getByRole("button", { name: "更多操作", exact: true })
  ).toBeVisible()
})

test("onboarding applies choices only after agreement and rejection disables services", async ({
  page,
}) => {
  await page.addInitScript(() => {
    Object.assign(window, { grants: [] })
    Object.assign(window, {
      chrome: {
        permissions: {
          request: async (value: unknown) => {
            ;(window as unknown as { grants: unknown[] }).grants.push(value)
            return true
          },
          remove: async () => true,
          contains: async () => true,
        },
      },
    })
  })
  await page.goto("/")
  const tour = page.getByRole("dialog")
  await tour.getByRole("checkbox", { name: /启用搜索联想/ }).check()
  await tour.getByRole("checkbox", { name: /下载网站图标/ }).check()
  expect(
    await page.evaluate(
      () => (window as unknown as { grants: unknown[] }).grants
    )
  ).toEqual([])
  await tour.getByRole("button", { name: "我同意", exact: true }).click()
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  await waitForStorageWrites(page)
  await expect
    .poll(
      async () =>
        (await readStoredState<{ icons: boolean }>(page, "omt.privacy")).icons
    )
    .toBe(true)
  expect(
    await page.evaluate(
      () => (window as unknown as { grants: unknown[] }).grants
    )
  ).toHaveLength(1)
  await tour.getByRole("button", { name: "上一步" }).click()
  await tour.getByRole("button", { name: "不同意", exact: true }).click()
  await expect(
    tour.getByRole("heading", { name: "搜索与打开结果" })
  ).toBeVisible()
  await waitForStorageWrites(page)
  const saved = await readStoredState<{
    suggestions: boolean
    icons: boolean
  }>(page, "omt.privacy")
  expect(saved.suggestions).toBe(false)
  expect(saved.icons).toBe(false)
})
