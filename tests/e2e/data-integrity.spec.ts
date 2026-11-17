import { expect, test } from "@playwright/test"
import { readStoredState, readStoredValue } from "../helpers/storage"

test("restoring components preserves folder size, artwork and right-edge calendar placement", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 })
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
              id: "folder",
              kind: "folder",
              name: "原尺寸",
              size: "small",
              color: "#3478f6",
              tabs: [],
            },
            {
              id: "art",
              kind: "dot-canvas",
              name: "原画",
              size: "wide",
              color: "#3478f6",
              pixels: Array(576).fill("#3478f6"),
            },
            {
              id: "date",
              kind: "calendar",
              name: "边缘日历",
              size: "medium",
              color: "#3478f6",
            },
          ],
          layouts: {
            8: {
              folder: { x: 0, y: 0 },
              date: { x: 6, y: 0 },
              art: { x: 0, y: 2 },
            },
          },
          mockDataVersion: 0,
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  const date = page.locator('[data-grid-item-id="date"]')
  await expect(date).toHaveCSS("grid-column-start", "7")
  await page.locator('[data-grid-item-id="folder"]').click({ button: "right" })
  await page.getByRole("menuitem", { name: "编辑", exact: true }).click()
  const editor = page.getByRole("dialog", { name: "编辑文件夹", exact: true })
  await editor.getByRole("button", { name: "关闭", exact: true }).click()
  await expect
    .poll(async () => {
      const { items } = await readStoredState<{
        items: {
          id: string
          size: string
          pixels?: string[]
          pixelColumns?: number
        }[]
      }>(page, "omt.tab-grid")
      const art = items.find((item) => item.id === "art")
      return {
        size: items.find((item) => item.id === "folder")?.size,
        count: art?.pixels?.length,
        columns: art?.pixelColumns ?? null,
        total: items.length,
      }
    })
    .toEqual({ size: "small", count: 576, columns: 24, total: 3 })
})

test("invalid saved component is skipped without rewriting the stored list", async ({
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
          items: [{ id: "invalid", kind: "unknown", name: "保留原始数据" }],
          layouts: {},
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
  // The unreadable component is dropped instead of blocking the page; the
  // degraded read is explained in the migration report.
  await expect(page.getByRole("combobox", { name: "对话输入" })).toBeVisible()
  await expect(page.locator("#root")).not.toContainText("保留原始数据")
  const items = await page.evaluate(
    () => JSON.parse(localStorage.getItem("omt.tab-grid")!).state.items
  )
  expect(items).toEqual([
    { id: "invalid", kind: "unknown", name: "保留原始数据" },
  ])
  const report = await readStoredValue<string>(page, "omt.migration-report")
  const entries = JSON.parse(report ?? "[]") as { key: string }[]
  expect(entries.some((entry) => entry.key === "omt.tab-grid")).toBe(true)
})
