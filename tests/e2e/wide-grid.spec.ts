import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

type Layouts = Record<number, Record<string, { x: number; y: number }>>

const storedLayouts = async (page: Parameters<typeof readStoredState>[0]) =>
  (await readStoredState<{ layouts: Layouts }>(page, "omt.tab-grid")).layouts

test("wide grids adapt and keep drag positions after reload", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    if (!localStorage.getItem("omt.tab-grid"))
      localStorage.setItem(
        "omt.tab-grid",
        JSON.stringify({
          state: {
            items: Array.from({ length: 6 }, (_, i) => ({
              id: `tab-${i}`,
              kind: "tab",
              name: `书签 ${i}`,
              url: `https://example.com/${i}`,
              color: "#6c8bd4",
              size: "small",
            })),
            layouts: {},
          },
          version: 0,
        })
      )
  })
  await page.setViewportSize({ width: 1920, height: 1000 })
  await page.goto("/")
  const cards = page.locator("[data-grid-item-id]")
  await expect(cards).toHaveCount(6)
  for (const [width, count] of [
    [900, 3],
    [1200, 4],
    [1440, 5],
    [1920, 5],
  ]) {
    await page.setViewportSize({ width, height: 1000 })
    await expect
      .poll(async () => {
        const bounds = await cards.evaluateAll((nodes) =>
          nodes.map((node) => node.getBoundingClientRect().top)
        )
        return bounds.filter((top) => Math.abs(top - bounds[0]) < 1).length
      })
      .toBe(count)
    const search = await page.locator('[data-tour="search"]').boundingBox()
    expect(search!.width).toBeLessThanOrEqual(768)
  }
  const first = cards.first()
  const box = (await first.boundingBox())!
  await page.mouse.move(box.x + 30, box.y + 20)
  await page.mouse.down()
  await page.mouse.move(box.x + 30, box.y + 140, { steps: 12 })
  await page.mouse.up()
  await expect
    .poll(async () => (await storedLayouts(page))[20]?.["tab-0"]?.y)
    .toBeGreaterThan(0)
  const saved = (await storedLayouts(page))[20]
  await page.reload()
  await expect(cards).toHaveCount(6)
  expect((await storedLayouts(page))[20]).toEqual(saved)
})

test("breakpoint layouts retain gaps and derive visual order only once", async ({
  page,
}) => {
  const original = { a: { x: 16, y: 4 }, b: { x: 0, y: 0 }, c: { x: 8, y: 2 } }
  await page.addInitScript(
    ({ original }) => {
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
      if (!localStorage.getItem("omt.tab-grid"))
        localStorage.setItem(
          "omt.tab-grid",
          JSON.stringify({
            state: {
              items: ["a", "b", "c"].map((id) => ({
                id,
                kind: "tab",
                name: id,
                url: `https://example.com/${id}`,
                color: "#6c8bd4",
                size: "small",
              })),
              layouts: { 20: original },
              lastLayoutColumns: 20,
            },
            version: 0,
          })
        )
    },
    { original }
  )
  const layouts = () => storedLayouts(page)
  await page.setViewportSize({ width: 1920, height: 1000 })
  await page.goto("/")
  await expect(page.locator("[data-grid-item-id]")).toHaveCount(3)
  await page.setViewportSize({ width: 900, height: 1000 })
  await expect
    .poll(async () => (await layouts())[12])
    .toEqual({ b: { x: 0, y: 0 }, c: { x: 4, y: 0 }, a: { x: 8, y: 0 } })
  expect((await layouts())[20]).toEqual(original)
  await page.setViewportSize({ width: 1920, height: 1000 })
  await expect
    .poll(() =>
      page
        .locator('[data-grid-item-id="a"]')
        .evaluate((node) => (node as HTMLElement).style.gridColumn)
    )
    .toBe("17 / span 4")
  expect((await layouts())[20]).toEqual(original)
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加标签", exact: true }).click()
  const creation = page.getByRole("dialog", { name: "配置标签", exact: true })
  await creation.getByLabel("名称", { exact: true }).fill("新增")
  await creation
    .getByLabel("网址", { exact: true })
    .fill("https://new.example/")
  await creation.getByRole("button", { name: "确认添加", exact: true }).click()
  await expect
    .poll(async () => Object.keys((await layouts())[12]).length)
    .toBe(4)
  const updated = await layouts()
  for (const id of ["a", "b", "c"] as const)
    expect(updated[20][id]).toEqual(original[id])
  await page.reload()
  await expect(page.locator("[data-grid-item-id]")).toHaveCount(4)
  expect(await layouts()).toEqual(updated)
  await page.setViewportSize({ width: 900, height: 1000 })
  await expect
    .poll(() =>
      page
        .locator('[data-grid-item-id="a"]')
        .evaluate((node) => (node as HTMLElement).style.gridColumn)
    )
    .toBe("9 / span 4")
  expect((await layouts())[12]).toEqual(updated[12])
})
