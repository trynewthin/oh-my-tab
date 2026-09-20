import { expect, test, type Page } from "@playwright/test"

import { readStoredState } from "../helpers/storage"

// The suite runs with a pinned zh-CN browser locale, so `system` resolves to
// Simplified Chinese everywhere else. These tests opt into English explicitly
// (`locale: "en-US"` or a seeded `omt.locale` preference) and cover the
// language contract: switching, persistence across reload, popup sharing,
// `<html lang>`/title updates, name stability, and localized default names.

const EN = {
  prompt: "Conversation input",
  openSettings: "Open settings",
  settings: "Settings",
  basic: "Basic",
  moreActions: "More actions",
  language: "Language",
  followSystem: "Follow system",
  chinese: "Chinese (Simplified)",
  english: "English",
} as const

const ZH = {
  prompt: "对话输入",
  openSettings: "打开设置",
  settings: "设置",
  basic: "基础",
} as const

async function seed(page: Page, preferences?: { locale?: string }) {
  await page.addInitScript((preference) => {
    localStorage.setItem(
      "omt.onboarding",
      JSON.stringify({ state: { seen: true }, version: 0 })
    )
    if (preference)
      localStorage.setItem(
        "omt.locale",
        JSON.stringify({ state: { preference }, version: 0 })
      )
  }, preferences?.locale)
}

async function openSettingsBasic(page: Page, t: typeof EN | typeof ZH) {
  await page.getByRole("button", { name: t.openSettings, exact: true }).click()
  const dialog = page.getByRole("dialog", { name: t.settings, exact: true })
  await dialog.getByRole("button", { name: t.basic, exact: true }).click()
  return dialog
}

test.describe("language preference", () => {
  test.use({ locale: "en-US" })

  test("system follows the browser locale and the English UI is complete", async ({
    page,
  }) => {
    await seed(page)
    await page.goto("/")
    await expect(page).toHaveTitle("Oh My Tab")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(
      page.getByRole("combobox", { name: EN.prompt, exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: EN.openSettings, exact: true })
    ).toBeVisible()

    const dialog = await openSettingsBasic(page, EN)
    await expect(dialog.getByText(EN.language, { exact: true })).toBeVisible()
    await expect(
      dialog.getByText(EN.followSystem, { exact: true })
    ).toBeVisible()
  })

  test("explicit zh-CN preference overrides an English browser locale", async ({
    page,
  }) => {
    await seed(page, { locale: "zh-CN" })
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN")
    await expect(
      page.getByRole("combobox", { name: ZH.prompt, exact: true })
    ).toBeVisible()
    await expect(
      page.getByRole("button", { name: ZH.openSettings, exact: true })
    ).toBeVisible()
  })

  test("language needs no extension API to switch and persists across reload", async ({
    page,
  }) => {
    await seed(page)
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")

    const dialog = await openSettingsBasic(page, EN)
    await dialog.getByRole("combobox", { name: EN.language }).click()
    await page.getByRole("option", { name: EN.chinese, exact: true }).click()

    // Switching is synchronous against bundled resources: the document and the
    // settings dialog both flip without a reload.
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN")
    await expect(
      page.getByRole("dialog", { name: ZH.settings, exact: true })
    ).toBeVisible()
    await page.keyboard.press("Escape")
    await expect(
      page.getByRole("combobox", { name: ZH.prompt, exact: true })
    ).toBeVisible()

    await page.reload()
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN")
    await expect(
      page.getByRole("combobox", { name: ZH.prompt, exact: true })
    ).toBeVisible()

    await expect
      .poll(async () => {
        const state = await readStoredState<{ preference: string }>(
          page,
          "omt.locale"
        )
        return state.preference
      })
      .toBe("zh-CN")
  })
})

test.describe("new tab and popup share the persisted language", () => {
  test("an English preference applies to both entries, including titles", async ({
    page,
    context,
  }) => {
    await seed(page, { locale: "en" })
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "en")
    await expect(page).toHaveTitle("Oh My Tab")

    const popup = await context.newPage()
    await popup.goto("/popup.html")
    await expect(popup.locator("html")).toHaveAttribute("lang", "en")
    await expect(popup).toHaveTitle("Quick Add · Oh My Tab")
  })

  test("the same preference yields zh-CN titles in both entries", async ({
    page,
    context,
  }) => {
    await seed(page, { locale: "zh-CN" })
    await page.goto("/")
    await expect(page.locator("html")).toHaveAttribute("lang", "zh-CN")
    await expect(page).toHaveTitle("Oh My Tab")

    const popup = await context.newPage()
    await popup.goto("/popup.html")
    await expect(popup.locator("html")).toHaveAttribute("lang", "zh-CN")
    await expect(popup).toHaveTitle("快速添加 · Oh My Tab")
  })
})

test.describe("names across a language change", () => {
  test("persisted user names survive a language switch unchanged", async ({
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
                id: "custom-folder",
                kind: "folder",
                name: "我的文件夹",
                color: "#6c8bd4",
                size: "small",
                tabs: [],
                dynamicEffect: false,
              },
              {
                id: "custom-tab",
                kind: "tab",
                name: "My Custom Tab",
                url: "https://example.com",
                color: "#6c8bd4",
                size: "small",
                dynamicEffect: false,
              },
            ],
            layouts: {},
          },
          version: 0,
        })
      )
    })
    await page.goto("/")
    await expect(page.getByText("我的文件夹", { exact: true })).toBeVisible()
    await expect(page.getByText("My Custom Tab", { exact: true })).toBeVisible()

    const dialog = await openSettingsBasic(page, ZH)
    await dialog.getByRole("combobox", { name: "语言" }).click()
    await page.getByRole("option", { name: EN.english, exact: true }).click()
    await page.keyboard.press("Escape")

    await expect(page.getByText("我的文件夹", { exact: true })).toBeVisible()
    await expect(page.getByText("My Custom Tab", { exact: true })).toBeVisible()
  })

  test("a new component gets a default name in the active language", async ({
    page,
  }) => {
    await seed(page, { locale: "en" })
    await page.goto("/")

    // The catalog path resolves the default name at creation time, in the
    // language active then.
    await page
      .getByRole("button", { name: EN.moreActions, exact: true })
      .click()
    await page.getByRole("button", { name: "Add component", exact: true }).click()
    const catalog = page.getByRole("dialog", { name: "Components", exact: true })
    await catalog
      .getByRole("button", { name: "Select To-do", exact: true })
      .click()
    // Selecting opens a second dialog with the direct-add confirmation.
    await page
      .getByRole("button", { name: "Confirm add", exact: true })
      .click()

    // The write is asynchronous, so poll until the item lands rather than
    // reading once and racing it.
    await expect
      .poll(async () => {
        const state = await readStoredState<{ items: { name: string }[] }>(
          page,
          "omt.tab-grid"
        )
        return state.items.at(-1)?.name
      })
      .toBe("To-do")
  })
})
