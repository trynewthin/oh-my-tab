import { expect, test } from "@playwright/test"

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
  await editor.getByRole("button", { name: "保存", exact: true }).click()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<{
            size: string
            count: number
            columns: unknown
            total: number
          }>((resolve) => {
            const request = indexedDB.open("oh-my-tab-data", 1)
            request.onsuccess = () => {
              const db = request.result
              const read = db
                .transaction("entries")
                .objectStore("entries")
                .get("omt.tab-grid")
              read.onsuccess = () => {
                const items = JSON.parse(read.result).state.items
                const art = items.find((i: { id: string }) => i.id === "art")
                resolve({
                  size: items.find((i: { id: string }) => i.id === "folder")
                    .size,
                  count: art.pixels.length,
                  columns: art.pixelColumns ?? null,
                  total: items.length,
                })
                db.close()
              }
            }
          })
      )
    )
    .toEqual({ size: "small", count: 576, columns: null, total: 3 })
})

test("invalid saved component stops loading without rewriting the stored list", async ({
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
  await expect(page.locator("#root")).toContainText("数据读取失败")
  const items = await page.evaluate(
    () =>
      new Promise<unknown>((resolve) => {
        const request = indexedDB.open("oh-my-tab-data", 1)
        request.onsuccess = () => {
          const db = request.result
          const read = db
            .transaction("entries")
            .objectStore("entries")
            .get("omt.tab-grid")
          read.onsuccess = () => {
            resolve(JSON.parse(read.result).state.items)
            db.close()
          }
        }
      })
  )
  expect(items).toEqual([
    { id: "invalid", kind: "unknown", name: "保留原始数据" },
  ])
})
