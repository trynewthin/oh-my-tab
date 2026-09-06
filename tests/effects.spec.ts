import { expect, test } from "@playwright/test"

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
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
  const flame = dialog.locator("[data-effect-phase]")
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
  await dialog.getByRole("button", { name: "主页设置", exact: true }).click()
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
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
  await expect(flame).toHaveAttribute("data-effect-phase", "visible")
})

test("toast disposal follows the exit lifecycle", async ({ page }) => {
  await page.addInitScript(() =>
    Object.defineProperty(navigator.clipboard, "readText", {
      value: async () => {
        throw new Error("Denied")
      },
    })
  )
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  const dialog = page.getByRole("dialog", { name: "设置", exact: true })
  await dialog.getByRole("button", { name: "常规设置", exact: true }).click()
  await dialog.getByRole("button", { name: "粘贴", exact: true }).click()
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
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
  await dialog.getByLabel("粒子效果", { exact: true }).click()
  await page.getByRole("option", { name: "浮游粒子", exact: true }).click()
  const surface = dialog.locator('[data-effect-style="particles"]')
  await expect(surface).toHaveAttribute("data-effect-phase", "visible")
  const pixels = () =>
    surface
      .locator("[data-burn-cell]")
      .evaluateAll((nodes) =>
        nodes.map((node) => (node as HTMLElement).style.transform)
      )
  const before = await pixels()
  const box = (await surface.boundingBox())!
  await page.mouse.move(box.x + box.width * 0.8, box.y + box.height * 0.6)
  await expect.poll(pixels).not.toEqual(before)
  await dialog.getByRole("slider", { name: "粒子幅度" }).focus()
  await dialog.getByRole("slider", { name: "粒子幅度" }).press("Home")
  await expect(dialog.getByRole("slider", { name: "粒子幅度" })).toHaveValue(
    "0"
  )
  await page.reload()
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await dialog.getByRole("button", { name: "个性化", exact: true }).click()
  await expect(dialog.getByLabel("粒子效果", { exact: true })).toContainText(
    "浮游粒子"
  )
  await expect(dialog.getByRole("slider", { name: "粒子幅度" })).toHaveValue(
    "0"
  )
  await dialog.getByLabel("粒子效果", { exact: true }).click()
  await page.getByRole("option", { name: "方格燃烧", exact: true }).click()
  await expect(dialog.locator('[data-effect-style="burning"]')).toBeVisible()
})
