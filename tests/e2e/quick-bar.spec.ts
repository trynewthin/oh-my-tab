import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    localStorage.setItem(
      "omt.home-settings",
      JSON.stringify({ state: { layoutMode: "free" }, version: 0 })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({ state: { items: [], layouts: {} }, version: 1 })
    )
  })
})

test("empty quick bar stays plain and aligned with the responsive grid", async ({
  page,
}) => {
  await page.goto("/")
  const bar = page.getByRole("toolbar", { name: "顶栏" })
  await expect(bar.locator("button, a")).toHaveCount(0)
  await expect(bar).toHaveCSS("background-color", "rgba(0, 0, 0, 0)")
  await expect(bar).toHaveCSS("border-top-width", "0px")

  for (const width of [1440, 700, 500, 320]) {
    await page.setViewportSize({ width, height: 900 })
    await expect
      .poll(async () => {
        const top = (await bar.boundingBox())!
        const grid = (await page
          .locator("[data-tab-grid-track]")
          .boundingBox())!
        return Math.max(
          Math.abs(top.x - grid.x),
          Math.abs(top.x + top.width - grid.x - grid.width),
          Math.abs(top.y - 8),
          Math.abs(top.height - 32),
          Math.abs(grid.y - top.y - top.height - 8)
        )
      })
      .toBeLessThan(1)
  }
})

test("top bar stays in place while the grid scrolls", async ({ page }) => {
  await page.goto("/")
  const bar = page.getByRole("toolbar", { name: "顶栏" })
  const scroll = page.locator("[data-grid-scroll]")
  const initialY = (await bar.boundingBox())!.y
  await page.locator('[data-tour="grid"]').evaluate((node) => {
    const section = node as HTMLElement
    section.style.minHeight = "1800px"
  })
  await scroll.evaluate((node) => {
    node.scrollTop = 500
  })
  await expect.poll(() => scroll.evaluate((node) => node.scrollTop)).toBe(500)
  await expect
    .poll(async () => (await bar.boundingBox())!.y)
    .toBeCloseTo(initialY, 1)
})

test("configure system and website icons independently of the grid", async ({
  page,
}) => {
  await page.goto("/")
  await page.locator("[data-tab-grid-track]").click({ button: "right" })
  await page.getByRole("menuitem", { name: "打开设置" }).click()
  const settings = page.getByRole("dialog", { name: "设置", exact: true })
  await settings.getByRole("button", { name: "主页", exact: true }).click()
  const preview = settings.getByRole("group", { name: "顶栏预览" })
  await expect(settings.getByRole("group", { name: "左侧操作栏" })).toHaveCount(
    0
  )
  await preview.getByRole("button", { name: "添加到左侧" }).click()
  const leftAdd = page.getByRole("dialog", { name: /添加.*到左侧/ })
  await expect(leftAdd.getByRole("tab", { name: "操作" })).toHaveAttribute(
    "aria-selected",
    "true"
  )
  await expect(
    leftAdd.getByRole("button", { name: "选择系统操作" })
  ).toBeVisible()
  await expect(leftAdd.getByRole("textbox", { name: "网页名称" })).toHaveCount(
    0
  )
  await leftAdd.getByRole("button", { name: "添加", exact: true }).click()
  await expect(leftAdd).toHaveCount(0)
  await preview.getByRole("button", { name: "添加到左侧" }).click()
  const leftSite = page.getByRole("dialog", { name: /添加.*到左侧/ })
  await leftSite.getByRole("tab", { name: "网页" }).click()
  await expect(
    leftSite.getByRole("button", { name: "选择系统操作" })
  ).toHaveCount(0)
  await expect(leftSite.getByRole("textbox", { name: "网页名称" })).toHaveCount(
    0
  )
  await leftSite.getByRole("textbox", { name: "网页网址" }).fill("example.com")
  await leftSite.getByRole("button", { name: "添加", exact: true }).click()
  await expect(leftSite).toHaveCount(0)
  await preview.getByRole("button", { name: "添加到右侧" }).click()
  const rightAdd = page.getByRole("dialog", { name: /添加.*到右侧/ })
  await rightAdd.getByRole("tab", { name: "网页" }).click()
  await rightAdd
    .getByRole("textbox", { name: "网页网址" })
    .fill("https://example.org")
  await rightAdd.getByRole("button", { name: "添加", exact: true }).click()
  await expect(rightAdd).toHaveCount(0)
  const rightIcon = preview.getByRole("button", { name: "example.org" })
  await expect
    .poll(async () => {
      const track = (await preview.boundingBox())!
      const icon = (await rightIcon.boundingBox())!
      return Math.abs(track.x + track.width - icon.x - icon.width)
    })
    .toBeLessThan(1)
  await expect(settings.getByLabel("顶栏中间文字")).toHaveCount(0)
  await settings.getByLabel("中间").click()
  await page.getByRole("option", { name: "文字", exact: true }).click()
  await settings.getByLabel("顶栏中间文字").fill("HELLO")

  await expect(preview).toBeVisible()
  await expect(
    preview.getByRole("button", { name: "切换深浅色" })
  ).toBeVisible()
  await expect(
    preview.getByRole("button", { name: "example.com" })
  ).toBeVisible()
  await expect(preview.getByText("HELLO")).toBeVisible()
  await settings.getByRole("button", { name: "关闭", exact: true }).click()

  const bar = page.getByRole("toolbar", { name: "顶栏" })
  await expect(bar.getByRole("button", { name: "切换深浅色" })).toBeVisible()
  await expect(bar.getByRole("link", { name: "example.com" })).toHaveAttribute(
    "href",
    "https://example.com/"
  )
  await expect(bar.getByText("HELLO")).toBeVisible()
  await expect(bar.getByRole("link", { name: "example.org" })).toHaveAttribute(
    "href",
    "https://example.org/"
  )
  await bar.getByRole("button", { name: "切换深浅色" }).click()
  await expect(page.locator("html")).toHaveClass(/dark/)
  await expect(
    page.locator("[data-tab-grid-track] [data-grid-item-id]")
  ).toHaveCount(0)
  await expect
    .poll(
      async () =>
        (
          await readStoredState<{
            quickBar: { left: unknown[]; right: unknown[] }
          }>(page, "omt.home-settings")
        ).quickBar.left.length
    )
    .toBe(2)
  await page.reload()
  await expect(bar.getByRole("link", { name: "example.com" })).toBeVisible()
  await expect(bar.getByText("HELLO")).toBeVisible()

  await page.locator("[data-tab-grid-track]").click({ button: "right" })
  await page.getByRole("menuitem", { name: "打开设置" }).click()
  await settings.getByRole("button", { name: "主页", exact: true }).click()
  const leftSide = preview.locator('[data-quick-bar-side="left"]')
  const rightSide = preview.locator('[data-quick-bar-side="right"]')
  await preview
    .getByRole("button", { name: "example.com" })
    .dragTo(preview.getByRole("button", { name: "切换深浅色" }), {
      targetPosition: { x: 2, y: 16 },
    })
  await expect(
    leftSide.locator("[data-quick-control-id]").first()
  ).toHaveAttribute("aria-label", "example.com")
  const leftBounds = (await leftSide.boundingBox())!
  await preview.getByRole("button", { name: "example.org" }).dragTo(leftSide, {
    targetPosition: { x: leftBounds.width - 2, y: 16 },
  })
  await expect(rightSide.locator("[data-quick-control-id]")).toHaveCount(0)
  await expect(leftSide.locator("[data-quick-control-id]")).toHaveCount(3)

  await preview
    .getByRole("button", { name: "example.com" })
    .click({ button: "right" })
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click()
  const edit = page.getByRole("dialog", { name: "编辑example.com" })
  await edit.getByRole("textbox", { name: "网页网址" }).fill("example.net")
  await edit.getByRole("button", { name: "保存", exact: true }).click()
  await preview
    .getByRole("button", { name: "example.org" })
    .click({ button: "right" })
  await page.getByRole("menuitem", { name: "移除example.org" }).click()
  await settings.getByRole("button", { name: "关闭", exact: true }).click()
  await expect(bar.getByRole("link", { name: "example.com" })).toHaveAttribute(
    "href",
    "https://example.net/"
  )
  await expect(bar.getByRole("link", { name: "example.org" })).toHaveCount(0)
  await expect(bar.locator("a, button").first()).toHaveAttribute(
    "aria-label",
    "example.com"
  )
})
