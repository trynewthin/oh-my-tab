import { expect, test } from "@playwright/test"
import {
  confirmedFolderDrop,
  folderMergeProgress,
  mixHexColor,
  overlapRatio,
  retainedFolderDrop,
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
  expect(confirmedFolderDrop(0.31)).toBe(false)
  expect(retainedFolderDrop(0.31)).toBe(true)
  expect(retainedFolderDrop(0.29)).toBe(false)
  expect(mixHexColor("#000000", "#ffffff", 0.5)).toBe("#808080")
})

test("dragged folder hides its source box", async ({ page }) => {
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
              id: "drag-folder",
              kind: "folder",
              name: "拖动文件夹",
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
  const folder = page.locator('[data-grid-item-id="drag-folder"]')
  const bounds = (await folder.boundingBox())!

  await page.mouse.move(bounds.x + 20, bounds.y + 20)
  await page.mouse.down()
  await page.mouse.move(bounds.x + bounds.width + 80, bounds.y + 80, {
    steps: 5,
  })

  await expect(folder).toHaveCSS("visibility", "hidden")
  await expect(folder).toHaveCSS("isolation", "auto")
  await expect(folder).toHaveCSS("border-top-width", "0px")
  await expect(folder.locator("[data-grid-item-content]")).toHaveCSS(
    "display",
    "none"
  )
  const overlay = page.locator("[data-tab-grid-overlay]")
  await expect(overlay).toBeVisible()
  await page.mouse.up()
  await expect(overlay).toHaveCount(0)
})

test("source folder stays fixed until an extracted tab is released", async ({
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
              id: "source-folder",
              kind: "folder",
              name: "来源文件夹",
              color: "#6c8bd4",
              size: "large",
              tabs: [
                {
                  id: "folder-tab",
                  name: "文件夹标签",
                  url: "https://example.com",
                  color: "#e25822",
                  dynamicEffect: true,
                },
              ],
            },
            {
              id: "neighbor-tab",
              kind: "tab",
              name: "相邻标签",
              url: "https://example.org",
              color: "#3478f6",
              size: "small",
            },
          ],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const folder = page.locator('[data-grid-item-id="source-folder"]')
  const neighbor = page.locator('[data-grid-item-id="neighbor-tab"]')
  const tab = page.getByRole("group", { name: "拖动 文件夹标签" })
  await expect(folder).toBeVisible()
  const before = (await folder.boundingBox())!
  const neighborBefore = (await neighbor.boundingBox())!
  const tabBounds = (await tab.boundingBox())!

  await page.mouse.move(
    tabBounds.x + tabBounds.width / 2,
    tabBounds.y + tabBounds.height / 2
  )
  await page.mouse.down()
  await page.mouse.move(
    tabBounds.x + tabBounds.width / 2,
    tabBounds.y + tabBounds.height / 2 + 12,
    { steps: 5 }
  )
  const sourceGap = folder.locator('[data-tab-id="__folder-gap__"]')
  await expect(sourceGap).toBeVisible()
  await expect(sourceGap.locator(":scope > *")).toHaveCount(0)
  const overlay = page.locator("[data-tab-grid-overlay]")
  const initialCanvas = await overlay
    .locator("[data-burning-canvas]")
    .elementHandle()
  expect(initialCanvas).not.toBeNull()
  await page.mouse.move(
    neighborBefore.x + neighborBefore.width / 2,
    neighborBefore.y + neighborBefore.height / 2,
    { steps: 10 }
  )
  await page.waitForTimeout(250)
  expect(await initialCanvas!.evaluate((node) => node.isConnected)).toBe(true)
  await page.waitForTimeout(400)

  expect(await folder.boundingBox()).toEqual(before)
  await expect
    .poll(async () => await neighbor.boundingBox())
    .not.toEqual(neighborBefore)
  const returnGap = folder.locator('[data-tab-id="__folder-gap__"]')
  await expect(returnGap).toBeVisible()
  await expect(returnGap.locator(":scope > *")).toHaveCount(0)
  await expect(folder.locator('[data-tab-id="folder-tab"]')).toHaveCount(0)
  const expanded = (await overlay.boundingBox())!

  await page.mouse.move(
    before.x + before.width / 2,
    before.y + before.height / 2,
    { steps: 10 }
  )
  await page.waitForTimeout(100)
  const returned = (await overlay.boundingBox())!
  expect(returned.height).toBeCloseTo(expanded.height, 0)
  const returnedCanvas = await overlay
    .locator("[data-burning-canvas]")
    .elementHandle()
  expect(returnedCanvas).not.toBeNull()
  await page.waitForTimeout(150)
  expect(await returnedCanvas!.evaluate((node) => node.isConnected)).toBe(true)
  await expect
    .poll(async () => (await overlay.boundingBox())?.height)
    .toBeCloseTo(expanded.height, 0)
  await page.mouse.up()
})

test("edge overlap previews folder movement and releases as a grid move", async ({
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
  await page.mouse.move(target.x + 4, target.y + source.height / 2, {
    steps: 10,
  })
  await expect(page.locator("[data-grid-drop-glow]")).toHaveCount(0)
  await expect(page.locator("[data-tab-grid-overlay]")).toBeVisible()
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
    const currentTarget = (await folder.boundingBox())!
    await page.mouse.move(
      currentTarget.x + currentTarget.width / 2,
      currentTarget.y + source.height / 2,
      { steps: 5 }
    )
    await expect(folder.locator("[data-folder-drop-glow]")).toHaveCount(0)
    await expect(page.locator("[data-tab-grid-overlay]")).toBeVisible()
    if (charged) {
      await page.waitForTimeout(100)
      const hovering = (await page
        .locator("[data-tab-grid-overlay]")
        .boundingBox())!
      const compactHeight = Number(
        await folder
          .locator("[data-folder-row-height]")
          .getAttribute("data-folder-row-height")
      )
      expect(hovering.height).toBeGreaterThan(
        compactHeight + (source.height - compactHeight) / 2
      )
      await page.mouse.move(
        source.x + source.width / 2,
        source.y + source.height / 2,
        { steps: 10 }
      )
      await page.waitForTimeout(100)
      const returned = (await page
        .locator("[data-tab-grid-overlay]")
        .boundingBox())!
      expect(returned.height).toBeGreaterThan(
        compactHeight + (source.height - compactHeight) / 2
      )
      await page.mouse.move(
        target.x + target.width / 2,
        target.y + source.height / 2,
        { steps: 10 }
      )
      await page.waitForTimeout(650)
    }
    await page.mouse.up()
    if (charged) {
      await expect(tab).toHaveCount(0)
      await expect(
        folder.getByRole("link", { name: "拖动标签", exact: true })
      ).toBeVisible()
    } else {
      await expect(tab).toBeVisible()
      await expect.poll(async () => await tab.boundingBox()).toEqual(source)
      await expect(
        folder.getByRole("link", { name: "拖动标签", exact: true })
      ).toHaveCount(0)
    }
  })
}
