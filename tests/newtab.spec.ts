import { expect, test } from "@playwright/test"

test("new tab renders the prompt input", async ({ page }) => {
  await page.goto("/")
  await expect(page.getByRole("textbox", { name: "对话输入" })).toBeVisible()
})

test("hash routes support direct entry, reload and unknown route fallback", async ({
  page,
}) => {
  await page.goto("/#/")
  await expect(page.getByRole("textbox", { name: "对话输入" })).toBeVisible()
  await page.reload()
  await expect(page.getByRole("textbox", { name: "对话输入" })).toBeVisible()
  await page.goto("/#/missing")
  await expect(page).toHaveURL(/#\/$/)
  await expect(page.getByRole("textbox", { name: "对话输入" })).toBeVisible()
})
