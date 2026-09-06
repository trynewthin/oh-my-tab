import { expect, test } from "@playwright/test"

test.beforeEach(async ({ page }) => {
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
              id: "existing",
              kind: "tab",
              name: "已有",
              url: "https://example.com/",
              size: "small",
              color: "#6c8bd4",
            },
            {
              id: "folder",
              kind: "folder",
              name: "开发",
              size: "large",
              color: "#6c8bd4",
              tabs: [
                { id: "child", name: "子书签", url: "https://child.example/" },
              ],
            },
          ],
          layouts: { 12: { existing: { x: 0, y: 0 }, folder: { x: 4, y: 0 } } },
        },
        version: 0,
      })
    )
  })
  await page.goto("/")
})

test("folder deletion can be undone without undoing another deletion", async ({
  page,
}) => {
  await page
    .getByRole("button", { name: "开发", exact: true })
    .click({ button: "right" })
  await page.getByRole("menuitem", { name: "删除", exact: true }).click()
  await page.getByRole("menuitem", { name: /确认删除/ }).click()
  await expect(
    page.getByRole("button", { name: "开发", exact: true })
  ).toHaveCount(0)
  await page
    .getByRole("link", { name: "已有", exact: true })
    .click({ button: "right" })
  await page.getByRole("menuitem", { name: "删除", exact: true }).click()
  await page.getByRole("menuitem", { name: "确认删除", exact: true }).click()
  await page.getByRole("button", { name: "撤销", exact: true }).first().click()
  await expect(
    page.getByRole("button", { name: "开发", exact: true })
  ).toBeVisible()
  await expect(
    page.getByRole("link", { name: "已有", exact: true })
  ).toHaveCount(0)
  await expect(
    page.getByRole("link", { name: "子书签", exact: true })
  ).toBeVisible()
  const stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("omt.tab-grid")!).state
  )
  expect(stored.layouts[12].folder).toEqual({ x: 4, y: 0 })
  await page.getByRole("button", { name: "撤销", exact: true }).click()
  await expect(
    page.getByRole("link", { name: "已有", exact: true })
  ).toBeVisible()
})

test("HTML import merges folders, preserves nested paths and deduplicates incrementally", async ({
  page,
}) => {
  await page.getByRole("button", { name: "打开设置", exact: true }).click()
  await page.getByRole("button", { name: "常规设置", exact: true }).click()
  const file = {
    name: "bookmarks.html",
    mimeType: "text/html",
    buffer: Buffer.from(`<!DOCTYPE NETSCAPE-Bookmark-file-1>
    <DL><p>
    <DT><A HREF="https://example.com">重复</A>
    <DT><H3>开发</H3><DL><p>
      <DT><A HREF="https://new.example/">新增</A>
      <DT><H3>React</H3><DL><p><DT><A HREF="https://react.dev/">React</A></DL><p>
    </DL><p>
    <DT><A HREF="https://new.example/">文件内重复</A>
    <DT><A HREF="javascript:alert(1)">无效</A>
    </DL><p>`),
  }
  await page.getByLabel("书签 HTML 文件").setInputFiles(file)
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "新增 2 个书签，跳过 2 个重复、1 个无效链接" })
  ).toBeVisible()
  let stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("omt.tab-grid")!).state
  )
  expect(
    stored.items.find((i: { id: string }) => i.id === "folder").tabs
  ).toHaveLength(2)
  expect(
    stored.items.find((i: { name: string }) => i.name === "开发 / React")
      .tabs[0].url
  ).toBe("https://react.dev/")
  expect(stored.layouts[12].existing).toEqual({ x: 0, y: 0 })
  await page.getByLabel("书签 HTML 文件").setInputFiles(file)
  await expect(
    page
      .getByRole("status")
      .filter({ hasText: "新增 0 个书签，跳过 4 个重复、1 个无效链接" })
  ).toBeVisible()
  stored = await page.evaluate(
    () => JSON.parse(localStorage.getItem("omt.tab-grid")!).state
  )
  expect(stored.items).toHaveLength(3)
  await page.getByLabel("书签 HTML 文件").setInputFiles({
    name: "bad.html",
    mimeType: "text/html",
    buffer: Buffer.from("<h1>not bookmarks</h1>"),
  })
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "请选择浏览器导出的书签 HTML 文件" })
  ).toBeVisible()
})
