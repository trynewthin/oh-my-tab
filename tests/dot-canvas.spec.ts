import { expect, test } from "@playwright/test"
import sharp from "sharp"

test("draw, undo, import and persist a 4 by 4 canvas", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  })
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作" }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  await page.getByRole("button", { name: "添加点阵画布" }).click()
  const dialog = page.getByRole("dialog", { name: "配置点阵画布" })
  const art = dialog.getByRole("img", { name: "点阵画布" })
  await expect(art.locator("rect")).toHaveCount(576)
  const box = (await art.boundingBox())!
  expect(Math.abs(box.width - box.height)).toBeLessThan(1)
  await page.mouse.move(box.x + box.width / 4, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + (box.width * 3) / 4, box.y + box.height / 2, {
    steps: 8,
  })
  await page.mouse.up()
  expect(await art.locator('rect[opacity="1"]').count()).toBeGreaterThan(10)
  await dialog.getByRole("button", { name: "撤销", exact: true }).click()
  await expect(art.locator('rect[opacity="1"]')).toHaveCount(0)
  const blue = await sharp({
    create: { width: 32, height: 32, channels: 4, background: "#0000ff" },
  })
    .png()
    .toBuffer()
  const buffer = await sharp({
    create: { width: 64, height: 32, channels: 4, background: "#ff0000" },
  })
    .composite([{ input: blue, left: 32, top: 0 }])
    .png()
    .toBuffer()
  await dialog
    .getByLabel("导入点阵图片")
    .setInputFiles({ name: "red.png", mimeType: "image/png", buffer })
  const crop = page.getByRole("dialog", { name: "调整图片范围" })
  await expect
    .poll(async () =>
      crop.locator("canvas").evaluate((canvas) => {
        const context = canvas.getContext("2d")!
        return context.getImageData(100, 100, 1, 1).data[3]
      })
    )
    .toBe(255)
  await crop.getByRole("slider", { name: "图片缩放" }).fill("2")
  const cropBox = (await crop
    .getByRole("img", { name: "拖动图片调整裁剪范围", exact: true })
    .boundingBox())!
  await page.mouse.move(cropBox.x + 20, cropBox.y + cropBox.height / 2)
  await page.mouse.down()
  await page.mouse.move(
    cropBox.x + cropBox.width - 20,
    cropBox.y + cropBox.height / 2,
    { steps: 8 }
  )
  await page.mouse.up()
  await crop.getByRole("button", { name: "确认范围" }).click()
  await expect(art.locator('rect[fill="#ff0000"]')).toHaveCount(576)
  await dialog.getByRole("button", { name: "取色", exact: true }).click()
  await art.click({ position: { x: box.width / 2, y: box.height / 2 } })
  await expect(dialog.getByLabel("画笔颜色")).toHaveValue("#ff0000")
  await expect(
    dialog.getByRole("button", { name: "画笔", exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await expect(art.locator('rect[fill="#ff0000"]')).toHaveCount(576)

  await dialog.getByRole("button", { name: "确认添加" }).click()
  const tile = page.getByRole("button", { name: "编辑点阵画布 点阵画布" })
  await expect(tile).toBeVisible()
  const article = tile.locator("..")
  for (const width of [1440, 1030, 390]) {
    await page.setViewportSize({ width, height: 969 })
    await expect
      .poll(async () => {
        const bounds = (await tile.boundingBox())!
        return Math.abs(bounds.width - bounds.height)
      })
      .toBeLessThan(1)
  }

  expect(
    await article.evaluate((node) => (node as HTMLElement).style.gridRow)
  ).toContain("span 4")
  await page.reload()
  await expect(tile.locator('rect[fill="#ff0000"]')).toHaveCount(576)
  await tile.click()
  const editor = page.getByRole("dialog", { name: "编辑点阵画布" })
  await editor.getByRole("button", { name: "清空", exact: true }).click()
  await editor.getByRole("button", { name: "取消", exact: true }).click()
  await expect(tile.locator('rect[fill="#ff0000"]')).toHaveCount(576)
})
