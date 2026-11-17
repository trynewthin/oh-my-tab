import { expect, test } from "@playwright/test"
import { readStoredState } from "../helpers/storage"

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
  await page.getByRole("button", { name: "效率", exact: true }).click()
  await page.getByRole("button", { name: "选择待办", exact: true }).click()
  const detail = page.getByRole("dialog", { name: "待办", exact: true })
  await expect(
    detail.getByRole("button", { name: "4×4", exact: true })
  ).toHaveAttribute("aria-pressed", "true")
  await detail.getByRole("button", { name: "添加", exact: true }).click()
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
  await expect(page.getByRole("menu")).toHaveCount(0)
  await region.getByRole("checkbox", { name: "完成 阅读", exact: true }).check()
  await expect
    .poll(async () => {
      const { items } = await readStoredState<{
        items: { kind: string; size: string; tasks: { done: boolean }[] }[]
      }>(page, "omt.tab-grid")
      const item = items.find((candidate) => candidate.kind === "todo")
      return item?.size === "large" && item.tasks.every((task) => task.done)
        ? item.tasks.length
        : -1
    })
    .toBe(2)
  await page.reload()
  await expect(
    region.getByRole("checkbox", { name: "完成 阅读", exact: true })
  ).toBeChecked()
  await region.getByRole("button", { name: "打开待办", exact: true }).click()
  const expanded = page.getByRole("dialog", { name: "待办", exact: true })
  const headerButtons = await Promise.all(
    ["添加待办", "关闭待办"].map((name) =>
      expanded
        .getByRole("button", { name, exact: true })
        .evaluate((element) => {
          const style = getComputedStyle(element)
          return {
            width: style.width,
            height: style.height,
            color: style.color,
            backgroundColor: style.backgroundColor,
            borderRadius: style.borderRadius,
            padding: style.padding,
          }
        })
    )
  )
  expect(headerButtons[0]).toEqual(headerButtons[1])
  const headerIcons = await Promise.all(
    ["添加待办", "关闭待办"].map((name) =>
      expanded
        .getByRole("button", { name, exact: true })
        .locator("svg")
        .evaluate((element) => ({
          width: getComputedStyle(element).width,
          height: getComputedStyle(element).height,
          strokeWidth: element.getAttribute("stroke-width"),
          strokeLinecap: element.getAttribute("stroke-linecap"),
        }))
    )
  )
  expect(headerIcons[0]).toEqual(headerIcons[1])
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
