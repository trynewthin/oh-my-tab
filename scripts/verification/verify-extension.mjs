import { chromium } from "@playwright/test"
import { mkdtemp, readFile, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"

// The UI language is a runtime preference, so this script never drives the
// extension through localized labels: it exercises every language mode and
// locates elements through language-independent hooks (`data-tour` markers,
// ARIA roles, the pixi canvas marker).
const extension = path.resolve("dist")
const messageLocales = ["zh_CN", "en"]
const languageModes = [
  { preference: "zh-CN", lang: "zh-CN" },
  { preference: "en", lang: "en" },
]

const manifest = JSON.parse(
  await readFile(path.join(extension, "manifest.json"), "utf8")
)
if (manifest.manifest_version !== 3)
  throw new Error(`Expected an MV3 manifest, got ${manifest.manifest_version}`)
if (manifest.default_locale !== "zh_CN")
  throw new Error(
    `Manifest default_locale must be zh_CN, got ${manifest.default_locale}`
  )
const placeholders = [
  ...new Set(
    [...JSON.stringify(manifest).matchAll(/__MSG_([A-Za-z0-9_]+)__/g)].map(
      (match) => match[1]
    )
  ),
].sort()
if (!placeholders.length)
  throw new Error("Manifest does not use any __MSG_*__ placeholders")

const messages = {}
for (const locale of messageLocales)
  messages[locale] = JSON.parse(
    await readFile(
      path.join(extension, "_locales", locale, "messages.json"),
      "utf8"
    )
  )
const localeKeys = Object.fromEntries(
  messageLocales.map((locale) => [locale, Object.keys(messages[locale]).sort()])
)
if (localeKeys.zh_CN.join() !== localeKeys.en.join())
  throw new Error(
    `Locale message keys differ: ${localeKeys.zh_CN} vs ${localeKeys.en}`
  )
for (const locale of messageLocales)
  for (const key of placeholders)
    if (!messages[locale][key]?.message?.trim())
      throw new Error(`Locale ${locale} has no message for ${key}`)
console.log(
  "PASS: manifest uses default_locale zh_CN and every placeholder resolves in zh_CN and en."
)

// The runtime applies the persisted preference after hydration, so the wait is
// bounded but the failure message reports what the shell actually rendered.
async function expectLanguage(page, language, errors) {
  try {
    await page.waitForFunction(
      (lang) => document.documentElement.lang === lang,
      language,
      { timeout: 15_000 }
    )
  } catch {
    const actual = await page.evaluate(() => document.documentElement.lang)
    throw new Error(
      `Expected <html lang> to become "${language}" but it stayed "${actual}" on ${page.url()}` +
        (errors.length ? `\n${errors.join("\n")}` : "")
    )
  }
}

const observed = []
for (const mode of languageModes) {
  const profile = await mkdtemp(path.join(tmpdir(), "oh-my-tab-verify-"))
  let context
  try {
    context = await chromium.launchPersistentContext(profile, {
      executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
      // Chrome does not load unpacked new-tab overrides reliably in headless mode.
      headless: false,
      channel: "chromium",
      args: [
        `--disable-extensions-except=${extension}`,
        `--load-extension=${extension}`,
      ],
      viewport: { width: 1440, height: 1000 },
    })
    // A fresh profile per language: `omt.locale` is device-local and already
    // committed on the first run, so the legacy localStorage copy is only
    // migrated once. `initializeStorage` migrates it before hydration.
    await context.addInitScript((preference) => {
      if (location.protocol !== "chrome-extension:") return
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
      localStorage.setItem(
        "omt.locale",
        JSON.stringify({ state: { preference }, version: 0 })
      )
    }, mode.preference)
    const page = await context.newPage()
    const errors = []
    page.on("pageerror", (error) => errors.push(error.message))
    page.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    await page.goto("chrome://newtab/")
    const input = page.getByRole("combobox")
    await input.waitFor()
    await page.locator('[data-tour="engine"]').waitFor()
    await page.locator("[data-pixi-matrix] canvas").waitFor()
    // The runtime owns <html lang> and the title; it applies the persisted
    // preference after hydration. The static shell must not pin either one.
    await expectLanguage(page, mode.lang, errors)
    if (
      !(await page.evaluate(
        () => typeof globalThis.chrome?.search?.query === "function"
      ))
    )
      throw new Error("Browser default search API unavailable in extension")
    const extensionName = await page.evaluate(
      () => globalThis.chrome?.i18n?.getMessage("extensionName") ?? ""
    )
    if (!extensionName)
      throw new Error(
        "chrome.i18n did not resolve the localized extension name"
      )
    const label = (await input.getAttribute("aria-label"))?.trim() ?? ""
    const title = (await page.title()).trim()
    if (!label)
      throw new Error(`Search input has no accessible name in ${mode.lang}`)
    if (!title) throw new Error(`New tab title is empty in ${mode.lang}`)
    const popupPage = await context.newPage()
    popupPage.on("pageerror", (error) => errors.push(error.message))
    popupPage.on("console", (message) => {
      if (message.type() === "error") errors.push(message.text())
    })
    await popupPage.goto(new URL("popup.html", page.url()).href)
    await expectLanguage(popupPage, mode.lang, errors)
    const popupTitle = (await popupPage.title()).trim()
    if (!popupTitle) throw new Error(`Popup title is empty in ${mode.lang}`)
    if (errors.length) throw new Error(errors.join("\n"))
    observed.push({ ...mode, label, title, popupTitle })
    console.log(
      `PASS: ${mode.lang} entries — new tab "${title}" / "${label}", popup "${popupTitle}".`
    )
  } finally {
    await context?.close()
    await rm(profile, { recursive: true, force: true })
  }
}
if (observed[0].label === observed[1].label)
  throw new Error(
    `Search label "${observed[0].label}" is identical in both language modes; the UI did not localize.`
  )
if (observed[0].popupTitle === observed[1].popupTitle)
  throw new Error(
    `Popup title "${observed[0].popupTitle}" is identical in both language modes; the popup did not localize.`
  )
console.log(
  "PASS: actual chrome://newtab override, both language modes, no runtime or CSP errors."
)
