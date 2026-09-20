import { test, expect } from "@playwright/test"
import { readStoredState, writeStoredState } from "../helpers/storage"

test("plant care, naming, time accumulation and album persist", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  )
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作" }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  await page.getByRole("button", { name: "趣味", exact: true }).click()
  await page.getByRole("button", { name: "选择像素花盆" }).click()
  await page.getByRole("button", { name: "4×4", exact: true }).click()
  await page
    .getByRole("button", { name: "添加", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: "编辑像素花盆" }).click()
  let panel = page.getByRole("dialog", { name: "像素花盆", exact: true })
  await panel.getByRole("button", { name: "播种", exact: true }).click()
  await expect(
    panel.getByRole("button", { name: "播种", exact: true })
  ).toBeDisabled()
  await panel.getByLabel("植物名称").fill("晚风")
  await panel.getByLabel("植物名称").press("Enter")
  await panel.getByRole("button", { name: "浇水", exact: true }).click()
  await expect(panel.getByText("点数 5", { exact: true })).toBeVisible()
  await expect
    .poll(async () => {
      const shared = await readStoredState<{ points: number }>(
        page,
        "omt.garden"
      )
      const grid = await readStoredState<{
        items: { kind: string; plants?: { name?: string }[] }[]
      }>(page, "omt.tab-grid")
      return [
        shared.points,
        grid.items.find((item) => item.kind === "ecosystem")?.plants?.[0]?.name,
      ]
    })
    .toEqual([5, "晚风"])
  await page.reload()
  await page.getByRole("button", { name: "编辑像素花盆" }).click()
  panel = page.getByRole("dialog", { name: "像素花盆", exact: true })
  await expect(panel.getByLabel("植物名称")).toHaveValue("晚风")
  await panel.getByRole("button", { name: "关闭", exact: true }).click()
  const grid = await readStoredState<{
    items: {
      kind: string
      plants: { plantedAt: number }[]
    }[]
    layouts: Record<number, unknown>
  }>(page, "omt.tab-grid")
  const garden = grid.items.find((item) => item.kind === "ecosystem")
  const shared = await readStoredState<{
    points: number
    pointsUpdatedAt: number
  }>(page, "omt.garden")
  if (!garden || garden.plants.length !== 1 || shared.points !== 5)
    throw new Error("Care state mismatch")
  garden.plants[0].plantedAt -= 6 * 86400000
  shared.pointsUpdatedAt -= 2.5 * 3600000
  await writeStoredState(page, "omt.garden", shared)
  await writeStoredState(page, "omt.tab-grid", grid)
  await page.reload()
  await page.getByRole("button", { name: "编辑像素花盆" }).click()
  panel = page.getByRole("dialog", { name: "像素花盆", exact: true })
  await expect(panel.getByText("点数 7", { exact: true })).toBeVisible()
  await expect(
    panel.getByRole("progressbar", { name: "点数积攒进度" })
  ).toHaveAttribute("aria-valuenow", "50")
  await panel.getByRole("button", { name: "收入图鉴", exact: true }).click()
  await expect(
    panel.getByRole("button", { name: "播种", exact: true })
  ).toBeEnabled()
  await panel.getByRole("button", { name: "图鉴", exact: true }).click()
  await page
    .getByRole("dialog", { name: "植物图鉴", exact: true })
    .getByRole("button", { name: /晚风/ })
    .click()
  await expect(panel.getByLabel("植物名称")).toHaveValue("晚风")
  await expect(panel.getByText("点数 7", { exact: true })).toBeVisible()
  await panel.getByRole("button", { name: "收入图鉴", exact: true }).click()
  await panel.getByRole("button", { name: "图鉴", exact: true }).click()
  await expect(
    page
      .getByRole("dialog", { name: "植物图鉴", exact: true })
      .getByRole("button", { name: /晚风/ })
  ).toHaveCount(1)
})

test("plant families animate without pointer interaction", async ({
  page,
}, testInfo) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    localStorage.setItem(
      "omt.tab-grid",
      JSON.stringify({
        state: {
          items: [2, 1, 7, 4, 0, 3].map((seed, i) => ({
            id: `plant-${i}`,
            kind: "ecosystem",
            name: "像素花盆",
            size: "large",
            color: "#42b883",
            species: "flowers",
            plants: [{ slot: 4, seed, plantedAt: 1, species: "flowers" }],
          })),
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const plants = page.locator(".ecosystem-plant")
  await expect(plants).toHaveCount(6)
  expect(
    new Set(
      await plants.evaluateAll((nodes) =>
        nodes.map((node) => node.getAttribute("data-family"))
      )
    ).size
  ).toBe(6)
  const canvases = page.locator("canvas[data-pixi-garden]")
  await expect(canvases).toHaveCount(6)
  const first = canvases.first()
  const image = () =>
    first.evaluate((node) => (node as HTMLCanvasElement).toDataURL())
  const before = await image()
  await expect.poll(image).not.toBe(before)
  await expect(plants.first()).toHaveCSS("animation-name", "none")
  await page.screenshot({ path: testInfo.outputPath("pixi-garden.png") })
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.waitForTimeout(100)
  const count = await first.getAttribute("data-render-count")
  await page.waitForTimeout(300)
  await expect(first).toHaveAttribute("data-render-count", count!)
})

test("daily check-in grants 100 points once and survives reload", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  )
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作" }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  await page.getByRole("button", { name: "趣味", exact: true }).click()
  await page.getByRole("button", { name: "选择像素花盆" }).click()
  await page.getByRole("button", { name: "4×4", exact: true }).click()
  await page
    .getByRole("button", { name: "添加", exact: true })
    .click()
  await expect(page.getByRole("dialog")).toHaveCount(0)
  await page.getByRole("button", { name: "编辑像素花盆" }).click()
  const panel = page.getByRole("dialog", { name: "像素花盆", exact: true })
  await panel.getByRole("button", { name: "每日签到", exact: true }).click()
  await expect(panel.getByText("点数 106", { exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "今日已签到" })).toBeDisabled()
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        points: number
        lastCheckIn?: string
      }>(page, "omt.garden")
      return [state.points, typeof state.lastCheckIn]
    })
    .toEqual([106, "string"])
  await page.reload()
  await page.getByRole("button", { name: "编辑像素花盆" }).click()
  await expect(panel.getByRole("button", { name: "今日已签到" })).toBeDisabled()
  await expect(panel.getByText("点数 106", { exact: true })).toBeVisible()
})

test("pots share points and collection but keep their own plants", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    if (!localStorage.getItem("shared-pot-test")) {
      localStorage.setItem(
        "omt.tab-grid",
        JSON.stringify({
          state: {
            items: [0, 1].map((i) => ({
              id: `pot-${i}`,
              kind: "ecosystem",
              name: "像素花盆",
              size: "large",
              species: "flowers",
              color: "#42b883",
              points: 10,
              plants:
                i === 0
                  ? [
                      {
                        slot: 4,
                        seed: 123,
                        plantedAt: 1,
                        species: "flowers",
                        name: "共享花",
                      },
                    ]
                  : [],
            })),
            layouts: {},
          },
          version: 0,
        })
      )
      localStorage.setItem("shared-pot-test", "1")
    }
  })
  await page.goto("/")
  await page.getByRole("button", { name: "编辑像素花盆" }).nth(0).click()
  const panel = page.getByRole("dialog", { name: "像素花盆", exact: true })
  await expect(panel.getByText("点数 20", { exact: true })).toBeVisible()
  await panel.getByRole("button", { name: "收入图鉴", exact: true }).click()
  await panel.getByRole("button", { name: "每日签到", exact: true }).click()
  await panel.getByRole("button", { name: "关闭", exact: true }).click()
  await page.getByRole("button", { name: "编辑像素花盆" }).nth(1).click()
  await expect(panel.getByText("点数 120", { exact: true })).toBeVisible()
  await expect(panel.getByRole("button", { name: "今日已签到" })).toBeDisabled()
  await panel.getByRole("button", { name: "图鉴", exact: true }).click()
  await page
    .getByRole("dialog", { name: "植物图鉴", exact: true })
    .getByRole("button", { name: /共享花/ })
    .click()
  await expect(panel.getByLabel("植物名称")).toHaveValue("共享花")
  await expect
    .poll(async () => {
      const state = await readStoredState<{
        items: { id: string; plants?: unknown[] }[]
      }>(page, "omt.tab-grid")
      return state.items
        .filter((item) => item.id === "pot-0" || item.id === "pot-1")
        .map((item) => item.plants?.length ?? 0)
    })
    .toEqual([0, 1])
  await page.reload()
  await expect(
    page.locator('[data-grid-item-id="pot-0"] .ecosystem-plant')
  ).toHaveCount(0)
  await expect(
    page.locator('[data-grid-item-id="pot-1"] .ecosystem-plant')
  ).toHaveCount(1)
})

test("album has four columns and bulk deletion can be undone", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" })
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    if (!localStorage.getItem("album-bulk-test")) {
      localStorage.setItem(
        "omt.tab-grid",
        JSON.stringify({
          state: {
            items: [
              {
                id: "pot",
                kind: "ecosystem",
                name: "像素花盆",
                size: "large",
                species: "flowers",
                color: "#42b883",
                plants: [],
              },
            ],
            layouts: {},
          },
          version: 0,
        })
      )
      localStorage.setItem(
        "omt.garden",
        JSON.stringify({
          state: {
            initialized: true,
            points: 6,
            pointsUpdatedAt: Date.now(),
            album: Array.from({ length: 20 }, (_, i) => ({
              slot: 4,
              seed: i,
              plantedAt: 1,
              species: "flowers",
              name: `植物${i}`,
            })),
          },
          version: 0,
        })
      )
      localStorage.setItem("album-bulk-test", "1")
    }
  })
  await page.goto("/")
  await page.getByRole("button", { name: "编辑像素花盆" }).click()
  await page.getByRole("button", { name: "图鉴", exact: true }).click()
  const album = page.getByRole("dialog", { name: "植物图鉴", exact: true })
  const manage = album.getByRole("button", { name: "批量管理" })
  const close = album.getByRole("button", { name: "关闭", exact: true })
  const manageBox = (await manage.boundingBox())!,
    closeBox = (await close.boundingBox())!
  expect(manageBox.x + manageBox.width).toBeLessThanOrEqual(closeBox.x)
  await expect
    .poll(async () =>
      album
        .locator("[data-album-scroll] button")
        .evaluateAll((nodes) =>
          Math.abs(
            nodes[0].getBoundingClientRect().y -
              nodes[3].getBoundingClientRect().y
          )
        )
    )
    .toBeLessThan(1)
  const scroll = album.locator("[data-album-scroll]")
  const outer = (await album.boundingBox())!,
    inner = (await scroll.boundingBox())!
  expect(inner.x + inner.width).toBeLessThan(outer.x + outer.width)
  await manage.click()
  await album.getByRole("checkbox", { name: "植物0", exact: true }).click()
  await album.getByRole("checkbox", { name: "植物1", exact: true }).click()
  await album.getByRole("button", { name: "删除 2", exact: true }).click()
  await expect(album.getByRole("checkbox")).toHaveCount(18)
  await page.getByRole("button", { name: "撤销", exact: true }).click()
  await expect(album.getByRole("checkbox")).toHaveCount(20)
})
