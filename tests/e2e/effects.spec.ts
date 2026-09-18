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

test("settings flame completes a cell transition and stops when hidden", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "外观", exact: true }).click()
  const flame = dialog.locator("[data-effect-phase]")
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
  await dialog.getByRole("button", { name: "顶部", exact: true }).click()
  await expect(flame).toHaveAttribute("data-effect-phase", "hidden")
  expect(
    await flame
      .locator("[data-burn-cell]")
      .evaluateAll((nodes) =>
        nodes.every(
          (node) =>
            (node as HTMLElement).style.backgroundColor === "transparent"
        )
      )
  ).toBe(true)
  await dialog.getByRole("button", { name: "外观", exact: true }).click()
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
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

test("particle style switches globally, responds to pointer and persists", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "动效", exact: true }).click()
  await dialog.getByRole("button", { name: "选择粒子效果" }).click()
  await page.getByRole("radio", { name: "呼吸点阵", exact: true }).click()
  const surface = dialog.locator('[data-effect-style="particles"]')
  await expect(surface).toHaveAttribute("data-effect-phase", "visible")
  await expect(surface.locator("canvas[data-particle-canvas]")).toBeAttached()
  const pixels = () =>
    surface
      .locator("canvas")
      .evaluate((node) => (node as HTMLCanvasElement).toDataURL())
  const before = await pixels()
  const box = (await surface.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6)
  await expect.poll(pixels).not.toEqual(before)
  await dialog.getByRole("slider", { name: "呼吸幅度" }).focus()
  await dialog.getByRole("slider", { name: "呼吸幅度" }).press("Home")
  await expect(dialog.getByRole("slider", { name: "呼吸幅度" })).toHaveValue(
    "0"
  )
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        effectStyle: string
        burningAmplitude: number
      }>(page, "omt.home-settings")
      return [state.effectStyle, state.burningAmplitude]
    })
    .toEqual(["particles", 0])
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await dialog.getByRole("button", { name: "动效", exact: true }).click()
  await expect(
    dialog.getByRole("button", { name: "选择粒子效果" })
  ).toContainText("呼吸点阵")
  await expect(dialog.getByRole("slider", { name: "呼吸幅度" })).toHaveValue(
    "0"
  )
  await dialog.getByRole("button", { name: "选择粒子效果" }).click()
  await page.getByRole("radio", { name: "方格燃烧", exact: true }).click()
  await expect(dialog.locator('[data-effect-style="burning"]')).toBeVisible()
})
