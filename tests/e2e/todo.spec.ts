import { expect, test } from "@playwright/test"

test("todo supports adding, completing, size options and persistence", async ({
  page,
}) => {
  await page.addInitScript(() =>
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
  )
  await page.goto("/")
  await page.getByRole("button", { name: "更多操作", exact: true }).click()
  await page.getByRole("button", { name: "添加组件", exact: true }).click()
  await page.getByRole("button", { name: "选择待办", exact: true }).click()
  const detail = page.getByRole("dialog", { name: "待办", exact: true })
  await expect(
    detail.getByRole("button", { name: "4×4", exact: true })
  ).toHaveCount(0)
  await detail.getByRole("button", { name: "确认添加", exact: true }).click()
  const region = page.getByRole("region", { name: "待办", exact: true })
  await expect(region.getByRole("textbox", { name: "新待办" })).toHaveCount(0)
  for (const text of ["完成今天的计划", "阅读"]) {
    await region.getByRole("button", { name: "添加待办", exact: true }).click()
    const addition = region
    await addition.getByRole("textbox", { name: "新待办" }).fill(text)
    await addition
      .getByRole("button", { name: "确认添加", exact: true })
      .click()
  }
  await region
    .getByRole("checkbox", { name: "完成 完成今天的计划", exact: true })
    .check()
  await region.click({ button: "right" })
  await expect(page.getByRole("menuitemradio")).toHaveCount(0)
  await page.keyboard.press("Escape")
  await region.getByRole("checkbox", { name: "完成 阅读", exact: true }).check()
  await expect
    .poll(() =>
      page.evaluate(
        () =>
          new Promise<number>((resolve, reject) => {
            const request = indexedDB.open("oh-my-tab-data", 1)
            request.onerror = () => reject(request.error)
            request.onsuccess = () => {
              const db = request.result
              const read = db
                .transaction("entries")
                .objectStore("entries")
                .get("omt.tab-grid")
              read.onsuccess = () => {
                const item = JSON.parse(read.result).state.items.find(
                  (i: { kind: string }) => i.kind === "todo"
                )
                resolve(
                  item?.size === "large" &&
                    item.tasks.every((task: { done: boolean }) => task.done)
                    ? item.tasks.length
                    : -1
                )
                db.close()
              }
            }
          })
      )
    )
    .toBe(2)
  await page.reload()
  await expect(
    region.getByRole("checkbox", { name: "完成 阅读", exact: true })
  ).toBeChecked()
  await region.getByRole("button", { name: "打开待办", exact: true }).click()
  const expanded = page.getByRole("dialog", { name: "待办", exact: true })
  await expanded.getByRole("button", { name: "删除 阅读", exact: true }).click()
  await expect(
    expanded.getByRole("checkbox", { name: "完成 阅读", exact: true })
  ).toBeVisible()
  await expanded
    .getByRole("button", { name: "确认删除 阅读", exact: true })
    .click()
  await expect(
    expanded.getByRole("checkbox", { name: "完成 阅读", exact: true })
  ).toHaveCount(0)
  await expanded.getByRole("button", { name: "关闭待办", exact: true }).click()
  await expect(expanded).toHaveCount(0)
  await expect(region.getByRole("checkbox")).toHaveCount(1)
})
