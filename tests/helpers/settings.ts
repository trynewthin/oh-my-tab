import type { Locator } from "@playwright/test"

export async function openStripTabSettings(dialog: Locator) {
  const tabs = dialog.getByRole("button", { name: "标签", exact: true })
  if ((await tabs.getAttribute("aria-expanded")) !== "true") await tabs.click()
  await dialog.getByRole("button", { name: "条形标签", exact: true }).click()
}
