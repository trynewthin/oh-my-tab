import { openStripTabSettings } from "../helpers/settings"
import { expect, test, type Locator } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    if (!localStorage.getItem("omt.home-settings"))
      localStorage.setItem(
        "omt.home-settings",
        JSON.stringify({
          state: { transitionsEnabled: true, burningAmplitude: 1 },
          version: 0,
        })
      )
  })
  await page.goto("/")
})

test("toolbar reverses an interrupted transition and honors reduced motion", async ({
  page,
}) => {
  const toggle = async () => {
    await page.getByRole("button", { name: "更多操作", exact: true }).click()
    await page.getByRole("button", { name: /^批量操作/ }).click()
  }
  const surface = page.locator('[aria-label="批量操作"]')
  await toggle()
  await expect(surface).toHaveAttribute("data-transition-phase", "visible")
  await toggle()
  await toggle()
  await expect(surface).toHaveAttribute("data-transition-phase", "visible")
  await expect(surface).toBeVisible()
  await page.emulateMedia({ reducedMotion: "reduce" })
  await toggle()
  await expect(surface).toHaveAttribute("data-transition-phase", "hidden")
  await toggle()
  await expect(surface).toHaveAttribute("data-transition-phase", "visible")
})

test("settings flame mounts with its pane and stops when hidden", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await openStripTabSettings(dialog)
  const flame = dialog
    .locator("[data-appearance-preview] [data-effect-phase]")
    .first()
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
  await expect(flame.locator("[data-burn-cell]").first()).toBeAttached()
  await dialog.getByRole("button", { name: "主页", exact: true }).click()
  await expect(
    dialog.locator("[data-appearance-preview] [data-effect-phase]")
  ).toHaveCount(0)
  await openStripTabSettings(dialog)
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
  await expect(flame.locator("[data-burn-cell]").first()).toBeAttached()
})

test("toast disposal follows the exit lifecycle", async ({ page }) => {
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加标签", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "配置标签", exact: true })
  await dialog.getByLabel("名称", { exact: true }).fill("无效标签")
  await dialog.getByLabel("网址", { exact: true }).fill("javascript:alert(1)")
  await dialog.getByRole("button", { name: "确认添加", exact: true }).click()
  const toast = page.locator('[aria-label="操作通知"] [data-transition-phase]')
  await expect(toast).toHaveAttribute("data-transition-phase", "visible")
  await page.getByRole("button", { name: "关闭通知", exact: true }).click()
  await expect(toast).toHaveCount(0)
  await expect(dialog).toBeVisible()
})

test("material cards configure independent preview surfaces and enforce placement support", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.setViewportSize({ width: 900, height: 540 })
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await openStripTabSettings(dialog)
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  const preview = dialog.getByRole("group", { name: "材质预览" })
  const backgroundMaterial = preview.locator(
    '[data-material-placement="background"] dd'
  )
  const catalog = dialog.getByRole("group", { name: "材质列表" })
  const viewport = catalog.locator("[data-material-carousel-viewport]")
  const configuration = dialog.getByRole("region", { name: "材质配置" })
  const configurationScroll = () =>
    configuration.evaluate((element) => element.scrollTop)
  const none = catalog.getByRole("button", { name: "无", exact: true })
  const particlesCard = catalog.getByRole("button", { name: "浮游点阵" })
  const starTrailsCard = catalog.getByRole("button", { name: "星轨唱片" })
  const previous = catalog.getByRole("button", { name: "上一个材质" })
  const next = catalog.getByRole("button", { name: "下一个材质" })
  const leadingOffset = async (card: Locator) => {
    const cardBox = await card.boundingBox()
    const viewportBox = await viewport.boundingBox()
    if (!cardBox || !viewportBox) return Infinity
    return Math.abs(cardBox.x - viewportBox.x)
  }

  await expect(
    catalog.getByRole("button", { name: "像素火焰" })
  ).toHaveAttribute("aria-pressed", "true")
  await previous.click()
  await expect.poll(() => leadingOffset(none)).toBeLessThan(2)

  await next.click()
  await viewport.hover()
  const scrollTopBeforeWheel = await configurationScroll()
  await page.mouse.wheel(0, 100)
  await expect.poll(() => leadingOffset(particlesCard)).toBeLessThan(2)
  expect(await configurationScroll()).toBe(scrollTopBeforeWheel)
  await particlesCard.click()
  await expect(particlesCard).toHaveAttribute("aria-pressed", "true")

  const chooseMaterial = (placement: string) =>
    preview
      .getByRole("combobox", { name: `选择${placement}材质`, exact: true })
      .click()
  const materialOption = (name: string) =>
    page.getByRole("option", { name, exact: true })

  await chooseMaterial("背景")
  await expect(materialOption("折光玻璃")).toHaveCount(0)
  await expect(materialOption("无")).toHaveAttribute("aria-selected", "true")
  await materialOption("像素火焰").click()

  await chooseMaterial("控件")
  await expect(materialOption("星轨唱片")).toHaveCount(0)
  await expect(materialOption("折光玻璃")).toBeVisible()
  await materialOption("浮游点阵").click()

  await chooseMaterial("卡片背景")
  await materialOption("星轨唱片").click()
  const starTrailsName = preview.getByRole("button", {
    name: "星轨唱片",
    exact: true,
  })
  await expect(starTrailsName).toBeVisible()
  await expect(particlesCard).toHaveAttribute("aria-pressed", "true")
  await expect.poll(() => leadingOffset(particlesCard)).toBeLessThan(2)

  await starTrailsName.click()
  await expect(starTrailsCard).toHaveAttribute("aria-pressed", "true")
  await expect.poll(() => leadingOffset(starTrailsCard)).toBeLessThan(2)
  const starTrails = dialog.getByRole("region", { name: "星轨唱片" })
  await expect(
    starTrails.getByRole("slider", { name: "运行速度" })
  ).toBeVisible()
  await expect(backgroundMaterial).toHaveText("像素火焰")
  await expect(
    preview.locator('[data-material-placement="card"] dd')
  ).toHaveText("星轨唱片")
  await expect(
    preview.locator('[data-material-placement="control"] dd')
  ).toHaveText("浮游点阵")
  await expect(
    preview.locator('[data-material-placement="card"] [data-effect-style]')
  ).toHaveAttribute("data-effect-style", "star-trails")

  const previewTop = () =>
    preview.evaluate((element) => element.getBoundingClientRect().top)
  const catalogTop = () =>
    catalog.evaluate((element) => element.getBoundingClientRect().top)
  await configuration.focus()
  await configuration.press("Home")
  await expect.poll(configurationScroll).toBe(0)
  const fixedPreviewTop = await previewTop()
  const fixedCatalogTop = await catalogTop()
  await configuration.press("End")
  await expect.poll(configurationScroll).toBeGreaterThan(0)
  expect(await previewTop()).toBeCloseTo(fixedPreviewTop, 0)
  expect(await catalogTop()).toBeCloseTo(fixedCatalogTop, 0)

  await preview.getByRole("button", { name: "收起材质列表" }).click()
  await expect(catalog).toBeHidden()
  const expandCatalog = preview.getByRole("button", { name: "展开材质列表" })
  await expect(expandCatalog).toHaveAttribute("aria-expanded", "false")
  await expect(starTrails).toBeVisible()
  await expandCatalog.click()
  await expect(catalog).toBeVisible()
  await expect(starTrailsCard).toHaveAttribute("aria-pressed", "true")

  const materials = preview.locator(
    "[data-material-preview-stage] [data-effect-style]"
  )
  await expect(materials).toHaveCount(3)

  const scrollable = preview.getByRole("region", { name: "可滚动的材质预览" })
  await scrollable.focus()
  const surfacePositions = () =>
    materials.evaluateAll((surfaces) =>
      surfaces.map((surface) => {
        const stage = surface.closest("[data-material-placement-preview]")!
        return (
          surface.getBoundingClientRect().top -
          stage.getBoundingClientRect().top
        )
      })
    )
  const [backgroundTop, cardTop, controlTop] = await surfacePositions()
  await scrollable.press("ArrowDown")
  await expect
    .poll(() => scrollable.evaluate((node) => node.scrollTop))
    .toBeGreaterThan(0)
  const [scrolledBackgroundTop, scrolledCardTop, scrolledControlTop] =
    await surfacePositions()
  expect(scrolledBackgroundTop).toBeLessThan(backgroundTop)
  expect(scrolledCardTop).toBeCloseTo(cardTop, 0)
  expect(scrolledControlTop).toBeCloseTo(controlTop, 0)
  await preview.getByRole("button", { name: "重置材质预览" }).click()
  await expect(backgroundMaterial).toHaveText("无")
  await expect(
    preview.locator('[data-material-placement="card"] dd')
  ).toHaveText("无")
  await expect(
    preview.locator('[data-material-placement="control"] dd')
  ).toHaveText("无")
  await expect(materials).toHaveCount(0)
})

test("particle style switches across surfaces and persists", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await openStripTabSettings(dialog)
  const preview = dialog.locator("[data-appearance-preview]")
  await dialog.getByRole("tab", { name: "背景", exact: true }).click()
  await dialog.getByRole("button", { name: "选择背景样式" }).click()
  await page.getByRole("radio", { name: "浮游点阵", exact: true }).click()
  await page.keyboard.press("Escape")
  const surfaces = preview.locator('[data-effect-style="particles"]')
  await expect(surfaces).toHaveCount(3)
  await expect(surfaces.first()).toHaveAttribute("data-effect-phase", "visible")
  await expect(
    surfaces.first().locator("canvas[data-particle-canvas]")
  ).toBeAttached()
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  const slider = dialog.getByRole("slider", { name: "呼吸幅度" })
  await slider.focus()
  await slider.press("Home")
  await expect(slider).toHaveValue("0")
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        tabTexture: string
        burningAmplitude: number
      }>(page, "omt.home-settings")
      return [state.tabTexture, state.burningAmplitude]
    })
    .toEqual(["particles", 0])
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await openStripTabSettings(dialog)
  await dialog.getByRole("tab", { name: "背景", exact: true }).click()
  await expect(
    dialog.getByRole("button", { name: "选择背景样式" })
  ).toContainText("浮游点阵")
  await dialog.getByRole("button", { name: "材质", exact: true }).click()
  await expect(dialog.getByRole("slider", { name: "呼吸幅度" })).toHaveValue(
    "0"
  )
  await openStripTabSettings(dialog)
  await dialog.getByRole("tab", { name: "背景", exact: true }).click()
  await dialog.getByRole("button", { name: "选择背景样式" }).click()
  await page.getByRole("radio", { name: "像素火焰", exact: true }).click()
  await page.keyboard.press("Escape")
  await expect(
    preview.locator('[data-effect-style="burning"]').first()
  ).toBeVisible()
})
