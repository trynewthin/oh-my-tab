import { expect, test } from "@playwright/test"
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
  await dialog.getByRole("button", { name: "标签", exact: true }).click()
  const flame = dialog
    .locator('[aria-label="标签预览"] [data-effect-phase]')
    .first()
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
  await expect(flame.locator("[data-burn-cell]").first()).toBeAttached()
  await dialog.getByRole("button", { name: "顶部", exact: true }).click()
  await expect(dialog.locator("[data-effect-phase]")).toHaveCount(0)
  await dialog.getByRole("button", { name: "标签", exact: true }).click()
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

test("particle style switches across surfaces and persists", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "标签", exact: true }).click()
  const preview = dialog.locator('[aria-label="标签预览"]')
  await dialog.getByRole("button", { name: "选择标签纹理" }).click()
  await page.getByRole("radio", { name: "浮游点阵", exact: true }).click()
  const surfaces = preview.locator('[data-effect-style="particles"]')
  await expect(surfaces).toHaveCount(3)
  await expect(surfaces.first()).toHaveAttribute("data-effect-phase", "visible")
  await expect(
    surfaces.first().locator("canvas[data-particle-canvas]")
  ).toBeAttached()
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
  await dialog.getByRole("button", { name: "标签", exact: true }).click()
  await expect(
    dialog.getByRole("button", { name: "选择标签纹理" })
  ).toContainText("浮游点阵")
  await expect(dialog.getByRole("slider", { name: "呼吸幅度" })).toHaveValue(
    "0"
  )
  await dialog.getByRole("button", { name: "选择标签纹理" }).click()
  await page.getByRole("radio", { name: "像素火焰", exact: true }).click()
  await expect(
    preview.locator('[data-effect-style="burning"]').first()
  ).toBeVisible()
})
