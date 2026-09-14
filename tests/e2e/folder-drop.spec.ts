import { expect, test } from "@playwright/test"
import {
  confirmedFolderDrop,
  folderMergeProgress,
  mixHexColor,
  overlapRatio,
} from "../../src/components/tab-grid/folder-drop"

test("folder merge uses overlap of the dragged tile", () => {
  const folder = { left: 0, top: 0, width: 100, height: 100 }
  const far = { left: 80, top: 80, width: 100, height: 100 }
  const close = { left: 20, top: 20, width: 80, height: 80 }
  expect(overlapRatio(far, folder)).toBeCloseTo(0.04)
  expect(confirmedFolderDrop(overlapRatio(far, folder))).toBe(false)
  expect(overlapRatio(close, folder)).toBeGreaterThan(0.42)
  expect(confirmedFolderDrop(overlapRatio(close, folder))).toBe(true)
  expect(folderMergeProgress(0.12)).toBe(0)
  expect(folderMergeProgress(0.42)).toBe(1)
  expect(mixHexColor("#000000", "#ffffff", 0.5)).toBe("#808080")
})

test("light overlap previews folder movement and releases as a grid move", async ({
  page,
}) => {
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
              id: "drag-tab",
              kind: "tab",
              name: "拖动标签",
              url: "https://example.com",
              color: "#6c8bd4",
              size: "small",
            },
            {
              id: "target-folder",
              kind: "folder",
              name: "目标文件夹",
              color: "#6c8bd4",
              size: "large",
              tabs: [],
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const tab = page.locator('[data-grid-item-id="drag-tab"]')
  const folder = page.locator('[data-grid-item-id="target-folder"]')
  await expect(folder).toBeVisible()
  const source = (await tab.boundingBox())!
  const target = (await folder.boundingBox())!
  await page.mouse.move(
    source.x + source.width / 2,
    source.y + source.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(
    target.x - source.width * 0.2,
    target.y + source.height / 2,
    { steps: 10 }
  )
  await expect.poll(async () => await folder.boundingBox()).not.toEqual(target)
  await page.mouse.up()
  await expect(tab).toBeVisible()
  await expect.poll(async () => await tab.boundingBox()).not.toEqual(source)
  await expect(
    folder.getByRole("link", { name: "拖动标签", exact: true })
  ).toHaveCount(0)
})

for (const charged of [false, true]) {
  test(`folder drop requires completed charge: ${charged}`, async ({
    page,
  }) => {
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
                id: "drag-tab",
                kind: "tab",
                name: "拖动标签",
                url: "https://example.com",
                color: "#6c8bd4",
                size: "small",
              },
              {
                id: "target-folder",
                kind: "folder",
                name: "目标文件夹",
                color: "#6c8bd4",
                size: "large",
                tabs: [],
              },
            ],
            layouts: {},
          },
          version: 0,
        })
      )
    })
    await page.goto("/")
    const tab = page.locator('[data-grid-item-id="drag-tab"]')
    const folder = page.locator('[data-grid-item-id="target-folder"]')
    await expect(folder).toBeVisible()
    const source = (await tab.boundingBox())!
    const target = (await folder.boundingBox())!
    await page.mouse.move(
      source.x + source.width / 2,
      source.y + source.height / 2
    )
    await page.mouse.down()
    await page.mouse.move(
      target.x + target.width / 2,
      target.y + source.height / 2,
      { steps: 10 }
    )
    if (charged) await page.waitForTimeout(650)
    await page.mouse.up()
    if (charged) {
      await expect(tab).toHaveCount(0)
      await expect(
        folder.getByRole("link", { name: "拖动标签", exact: true })
      ).toBeVisible()
    } else {
      await expect(tab).toBeVisible()
      await expect(
        folder.getByRole("link", { name: "拖动标签", exact: true })
      ).toHaveCount(0)
    }
  })
}
