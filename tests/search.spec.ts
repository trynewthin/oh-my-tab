import { expect, test } from "@playwright/test"

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
              id: "one",
              kind: "tab",
              name: "React",
              url: "https://react.dev/",
              size: "small",
              color: "#6c8bd4",
            },
            {
              id: "folder",
              kind: "folder",
              name: "Work",
              size: "small",
              color: "#6c8bd4",
              tabs: [
                {
                  id: "two",
                  name: "React docs",
                  url: "https://react.dev/reference",
                },
                {
                  id: "three",
                  name: "React duplicate",
                  url: "https://react.dev/",
                },
              ],
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
    const opened: string[] = []
    Object.assign(window, { opened })
    window.open = (url) => {
      opened.push(String(url))
      return null
    }
  })
  await page.route("**/__suggestions?**", (route) =>
    route.fulfill({ json: ["", []] })
  )
  await page.goto("/")
})

test("searches by default and opens folder bookmarks with keyboard selection", async ({
  page,
}) => {
  const input = page.getByRole("combobox", { name: "对话输入" })
  await expect(input).toBeVisible()
  await page.keyboard.press("/")
  await expect(input).toBeFocused()
  await input.fill("react")
  await expect(page.getByRole("option")).toHaveCount(2)
  await input.press("Enter")
  await expect(input).toHaveValue("")
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { opened: string[] }).opened[0])
    )
    .toBe("https://www.google.com/search?q=react")
  await input.fill("react")
  await input.press("ArrowDown")
  await input.press("ArrowDown")
  await expect(page.getByRole("option", { selected: true })).toContainText(
    "React docs"
  )
  await input.press("Enter")
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { opened: string[] }).opened[1])
    )
    .toBe("https://react.dev/reference")
  await expect(input).toHaveValue("")
})

test("suggestions dismiss, support clicks, and preserve IME composition", async ({
  page,
}) => {
  const input = page.getByRole("combobox", { name: "对话输入" })
  await input.fill("react")
  await input.press("Escape")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await expect(input).toHaveValue("react")
  await input.press("ArrowDown")
  await page.getByRole("option").first().click()
  await expect(input).toHaveValue("")
  await input.fill("中文")
  await input.dispatchEvent("keydown", { key: "Enter", isComposing: true })
  await expect(input).toHaveValue("中文")
  await expect
    .poll(() =>
      page.evaluate(
        () => (window as unknown as { opened: string[] }).opened.length
      )
    )
    .toBe(1)
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.keyboard.press("/")
  await expect(
    page.getByRole("dialog", { name: "设置", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("combobox", { name: "对话输入", includeHidden: true })
  ).not.toBeFocused()
})

test("compact toolbar fits and search button uses the selected engine", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 667 })
  const input = page.getByRole("combobox", { name: "对话输入" })
  await page
    .getByRole("button", { name: "搜索引擎：Google", exact: true })
    .click()
  await page.getByRole("button", { name: "Bing", exact: true }).click()
  await input.fill("test words")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await input.press("ArrowDown")
  await expect(input).not.toHaveAttribute("aria-activedescendant")
  const submit = page.getByRole("button", { name: "搜索", exact: true })
  await expect(submit).toBeInViewport()
  await submit.click()
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { opened: string[] }).opened[0])
    )
    .toBe("https://www.bing.com/search?q=test%20words")
  await expect(input).toHaveValue("")
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)
    )
    .toBe(true)
})

test("live suggestions use provider words and search with the current engine", async ({
  page,
}) => {
  await page.route("**/__suggestions?**", (route) =>
    route.fulfill({
      json: ["hello", ["hello world", "hello kitty", "hello world", 42]],
    })
  )
  const input = page.getByRole("combobox", { name: "对话输入" })
  await input.fill("hello")
  await expect(page.getByRole("option")).toHaveCount(2)
  await expect(page.getByRole("option").first()).toContainText("hello world")
  await input.press("ArrowDown")
  await input.press("Enter")
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { opened: string[] }).opened[0])
    )
    .toBe("https://www.google.com/search?q=hello%20world")
  await expect(input).toHaveValue("")
})

test("outdated responses stay hidden and an unavailable provider leaves search usable", async ({
  page,
}) => {
  let release!: () => void
  const pending = new Promise<void>((resolve) => {
    release = resolve
  })
  await page.route("**/__suggestions?**", async (route) => {
    if (new URL(route.request().url()).searchParams.get("q") === "old") {
      await pending
      await route.fulfill({ json: ["old", ["old result"]] }).catch(() => {})
    } else await route.fulfill({ status: 503, body: "" })
  })
  const input = page.getByRole("combobox", { name: "对话输入" })
  const request = page.waitForRequest("**/__suggestions?q=old")
  await input.fill("old")
  await request
  await input.fill("new")
  release()
  await page.waitForResponse("**/__suggestions?q=new")
  await expect(page.getByRole("listbox")).toHaveCount(0)
  await input.press("Enter")
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { opened: string[] }).opened[0])
    )
    .toBe("https://www.google.com/search?q=new")
})
