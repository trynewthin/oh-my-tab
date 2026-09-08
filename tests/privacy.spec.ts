import { expect, test } from "@playwright/test"

test("network features require consent and browser search is the default", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    Object.assign(window, { searchCalls: [] })
    Object.assign(window, {
      chrome: {
        search: {
          query: async (value: unknown) => {
            ;(window as unknown as { searchCalls: unknown[] }).searchCalls.push(
              value
            )
          },
        },
        permissions: {
          request: async () => true,
          contains: async () => true,
          remove: async () => true,
        },
      },
    })
  })
  let requests = 0
  await page.route("**/__suggestions?**", (route) => {
    requests++
    return route.fulfill({ json: ["", ["hello world"]] })
  })
  await page.goto("/")
  const input = page.getByRole("combobox", { name: "对话输入" })
  await input.fill("hello")
  await page.waitForTimeout(500)
  expect(requests).toBe(0)
  await input.press("Enter")
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { searchCalls: unknown[] }).searchCalls
      )
    )
    .toEqual([{ text: "hello", disposition: "NEW_TAB" }])
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.getByRole("button", { name: "关于", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "隐私政策与数据删除说明" })
  ).toHaveAttribute("href", "https://oh-my-tab-privacy.vercel.app/")
  const toggle = page.getByRole("checkbox", { name: /启用搜索联想/ })
  await expect(toggle).not.toBeChecked()
  await toggle.check()
  await page.keyboard.press("Escape")
  await input.fill("hello")
  await page.waitForTimeout(400)
  expect(requests).toBe(0)
  await page.getByRole("button", { name: "搜索引擎：浏览器默认", exact: true }).click()
  await page.getByRole("button", { name: "Google", exact: true }).click()
  await input.focus()
  await expect.poll(() => requests).toBeGreaterThan(0)
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await toggle.uncheck()
  await page.keyboard.press("Escape")
  const before = requests
  await input.fill("private keyword")
  await page.waitForTimeout(500)
  expect(requests).toBe(before)
})

test("denied optional permission leaves suggestions disabled", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    Object.assign(window, {
      chrome: { permissions: { request: async () => false } },
    })
  })
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.getByRole("button", { name: "关于", exact: true }).click()
  const toggle = page.getByRole("checkbox", { name: /启用搜索联想/ })
  await toggle.click()
  await expect(toggle).not.toBeChecked()
  await expect(page.getByRole("alert")).toContainText("未获得网站访问授权")
  await page.screenshot({ path: "artifacts/privacy-settings.png" })
})

test("preview uses the displayed engine when browser search is unavailable", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    localStorage.setItem(
      "omt.privacy",
      JSON.stringify({ state: { browserSearch: true }, version: 0 })
    )
    Object.assign(window, { chrome: {}, opened: [] })
    window.open = (url) => {
      ;(window as unknown as { opened: string[] }).opened.push(String(url))
      return null
    }
  })
  await page.goto("/")
  await page
    .getByRole("button", { name: "搜索引擎：Google", exact: true })
    .click()
  await expect(
    page.getByRole("button", { name: "浏览器默认", exact: true })
  ).toHaveCount(0)
  await page.keyboard.press("Escape")
  const input = page.getByRole("combobox", { name: "对话输入" })
  await input.fill("hello")
  await input.press("Enter")
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { opened: string[] }).opened)
    )
    .toEqual(["https://www.google.com/search?q=hello"])
  await expect(page.getByRole("alert")).toHaveCount(0)
})
