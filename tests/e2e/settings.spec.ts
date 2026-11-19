import { openStripTabSettings } from "../helpers/settings"
import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  })
})

test("custom search engines validate URLs and persist selection", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "搜索", exact: true }).click()
  const openInNewTab = dialog.getByRole("switch", {
    name: "搜索时跳转到新标签",
    exact: true,
  })
  await expect(openInNewTab).toBeChecked()
  await openInNewTab.uncheck()
  await dialog.getByRole("button", { name: "添加", exact: true }).click()
  const add = page.getByRole("dialog", { name: "添加搜索引擎", exact: true })
  await add.getByLabel("名称", { exact: true }).fill("Example Search")
  await add
    .getByLabel("搜索地址", { exact: true })
    .fill("javascript:alert('{query}')")
  await add.getByRole("button", { name: "保存", exact: true }).click()
  await expect(page.getByRole("alert")).toBeVisible()
  await add
    .getByLabel("搜索地址", { exact: true })
    .fill("http://127.0.0.1:4173/search?q={query}")
  await add.getByRole("button", { name: "保存", exact: true }).click()
  await dialog
    .getByRole("button", { name: "使用 Example Search", exact: true })
    .click()
  await dialog.getByRole("button", { name: "关闭", exact: true }).click()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        selectedId: string
        openInNewTab: boolean
        engines: { id: string; name: string }[]
      }>(page, "omt.search-engines")
      const engine = state.engines.find(
        (item) => item.name === "Example Search"
      )
      return {
        selected: engine?.id === state.selectedId,
        openInNewTab: state.openInNewTab,
      }
    })
    .toEqual({ selected: true, openInNewTab: false })
  await page.reload()
  await expect(
    page.getByRole("button", { name: "搜索引擎：Example Search", exact: true })
  ).toBeVisible()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await expect(openInNewTab).not.toBeChecked()
  await dialog.getByRole("button", { name: "关闭", exact: true }).click()
  const input = page.getByRole("combobox", { name: "对话输入" })
  await input.fill("same tab")
  await input.press("Enter")
  await page.waitForURL("**/search?q=same%20tab")
})

test("personalization persists theme color and home settings filter unsupported text", async ({
  page,
}) => {
  await page.goto("/#/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "主页", exact: true }).click()
  await dialog
    .getByRole("group", { name: "个性化", exact: true })
    .getByRole("button", { name: "基础", exact: true })
    .click()
  await dialog.getByRole("button", { name: "选择主题色", exact: true }).click()
  await page.getByLabel("主题色", { exact: true }).fill("#a855f7")
  await page.keyboard.press("Escape")
  await dialog.getByRole("button", { name: "主页", exact: true }).click()
  await dialog.getByLabel("点阵显示内容").click()
  await page.getByRole("option", { name: "字符", exact: true }).click()
  await dialog.getByLabel("显示字符").fill("HELLO中文 2026")
  await expect(dialog.getByLabel("显示字符")).toHaveValue("HELLO 2026")
  await expect
    .poll(async () => {
      const state = await readStoredState<{ color: string; text: string }>(
        page,
        "omt.home-settings"
      )
      return { color: state.color, text: state.text }
    })
    .toEqual({ color: "#a855f7", text: "HELLO 2026" })
  await page.reload()
  await expect(
    page.getByRole("img", { name: "HELLO 2026", exact: true })
  ).toBeVisible()
  expect(
    (await readStoredState<{ color: string }>(page, "omt.home-settings")).color
  ).toBe("#a855f7")
})

test("personalization persists global burning controls", async ({ page }) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  const amplitude = dialog.getByRole("slider", { name: "燃烧幅度" })
  await expect(amplitude).toHaveValue("1")
  await amplitude.focus()
  await amplitude.press("End")
  await expect(amplitude).toHaveValue("2")
  const entrance = dialog.getByRole("switch", { name: "过渡效果" })
  await expect(entrance).not.toBeChecked()
  await entrance.click()
  await expect(entrance).toBeChecked()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        burningAmplitude: number
        transitionsEnabled: boolean
      }>(page, "omt.home-settings")
      return [state.burningAmplitude, state.transitionsEnabled]
    })
    .toEqual([2, true])
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  await expect(amplitude).toHaveValue("2")
  await expect(entrance).toBeChecked()
})

test("appearance previews use full-size samples and keep settings navigation available", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "文件夹", exact: true }).click()

  const preview = dialog.locator("[data-appearance-preview]")
  const folderSamples = preview.locator(
    '[data-appearance-preview-size="large"]'
  )
  await expect(folderSamples).toHaveCount(2)
  await expect(folderSamples.first()).toHaveCSS("width", "286px")
  await expect(folderSamples.first()).toHaveCSS("height", "286px")
  await expect(preview).toHaveCSS("overflow", "hidden")
  await expect(preview).toHaveAttribute("inert", "")
  await expect(preview.getByText("收藏", { exact: true })).toBeAttached()
  await expect(
    preview.getByRole("button", { name: "收藏", exact: true })
  ).toHaveCount(0)
  const folderShadow = dialog.getByRole("tablist", {
    name: "阴影",
    exact: true,
  })
  await folderShadow.getByRole("tab", { name: "无", exact: true }).click()
  await expect(preview.locator(".folder-glass").first()).toHaveCSS(
    "box-shadow",
    "none"
  )
  await folderShadow.getByRole("tab", { name: "大", exact: true }).click()
  await expect(preview.locator(".folder-glass").first()).not.toHaveCSS(
    "box-shadow",
    "none"
  )

  await openStripTabSettings(dialog)
  await expect(
    preview.locator('[data-appearance-preview-size="medium"]')
  ).toHaveCSS("height", "135px")
  await expect(
    preview.locator('[data-appearance-preview-size="small"]')
  ).toHaveCount(2)
  await dialog.getByRole("button", { name: "方形标签", exact: true }).click()
  await expect(preview.locator("[data-appearance-preview-size]")).toHaveCount(3)
  await expect(
    preview.locator('[data-appearance-preview-size="square-large"]')
  ).toHaveCSS("width", "286px")
  await expect(
    preview.locator('[data-appearance-preview-size="square-medium"]')
  ).toHaveCSS("width", "135px")
  await expect(
    preview.locator('[data-appearance-preview-size="square-small"]')
  ).toHaveCSS("width", "59.5px")
  await dialog.getByRole("tab", { name: "边框与阴影", exact: true }).click()
  await dialog
    .getByRole("tablist", { name: "阴影", exact: true })
    .getByRole("tab", { name: "中", exact: true })
    .click()
  const squareSurface = preview.locator("[data-tab-surface]").first()
  await expect(squareSurface).not.toHaveCSS("box-shadow", "none")

  await openStripTabSettings(dialog)
  await expect(preview.locator("[data-tab-surface]").first()).toHaveCSS(
    "box-shadow",
    "none"
  )
  await dialog.getByRole("tab", { name: "背景", exact: true }).click()
  await expect(dialog).toBeVisible()
  await expect(
    dialog.getByRole("button", { name: "选择背景样式", exact: true })
  ).toBeVisible()
})

test("mobile settings uses full-screen application navigation", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await expect
    .poll(async () => {
      const bounds = await dialog.boundingBox()
      return bounds
        ? [bounds.x, bounds.y, bounds.width, bounds.height].map(Math.round)
        : null
    })
    .toEqual([0, 0, 390, 844])
  await expect(
    dialog.locator("header").getByRole("button", { name: "添加", exact: true })
  ).toBeVisible()

  await dialog.getByRole("button", { name: "设置分类", exact: true }).click()
  const navigation = page.getByRole("navigation", { name: "设置分类" })
  await expect(navigation).toBeVisible()
  await navigation.getByRole("button", { name: "文件夹", exact: true }).click()

  await expect(
    dialog.locator("header").getByText("文件夹", { exact: true })
  ).toBeVisible()
  await expect(navigation).not.toBeVisible()
  await expect(dialog).toBeVisible()
})

test("clicking the blurred backdrop closes an application", async ({
  page,
}) => {
  await page.goto("/")
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await expect(dialog).toBeVisible()

  await page.mouse.click(10, 10)
  await expect(dialog).not.toBeVisible()
})

test("bookmark entrance settles into its saved static background", async ({
  page,
}) => {
  await page.clock.install()
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.home-settings",
      JSON.stringify({
        state: { transitionsEnabled: true, burningAmplitude: 1 },
        version: 0,
      })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({
        state: {
          items: [
            {
              id: "entry",
              kind: "tab",
              name: "入场",
              url: "https://example.com",
              size: "small",
              color: "#6c8bd4",
              dynamicEffect: false,
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const tile = page.locator('[data-grid-item-id="entry"]')
  await expect(tile.locator('[data-burning-entrance="running"]')).toHaveCount(1)
  await page.clock.runFor(1800)
  await expect(tile.locator('[data-burning-entrance="running"]')).toHaveCount(0)
  const pixels = () =>
    tile
      .locator("[data-burn-cell]")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLElement).style.backgroundColor)
      )
  const still = await pixels()
  expect(still.some((value) => value !== "transparent")).toBe(true)
  await page.clock.runFor(1000)
  expect(await pixels()).toEqual(still)
})
