import { chromium } from "@playwright/test"
import { existsSync } from "node:fs"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
const executablePath =
  process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ||
  (existsSync(chrome) ? chrome : undefined)
const profile = await mkdtemp(path.join(tmpdir(), "oh-my-tab-verify-"))
let context
try {
  const extension = path.resolve("dist")
  context = await chromium.launchPersistentContext(profile, {
    executablePath,
    // Chrome does not load unpacked new-tab overrides reliably in headless mode.
    headless: false,
    ...(executablePath ? {} : { channel: "chromium" }),
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    viewport: { width: 1440, height: 1000 },
  })
  await context.addInitScript(() => {
    if (location.protocol === "chrome-extension:")
      localStorage.setItem(
        "omt.onboarding",
        JSON.stringify({ state: { seen: true }, version: 0 })
      )
  })
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.goto("chrome://newtab/")
  await page.getByRole("combobox", { name: "对话输入" }).waitFor()
  if (
    !(await page.evaluate(
      () => typeof globalThis.chrome?.search?.query === "function"
    ))
  )
    throw new Error("Browser default search API unavailable in extension")
  await page
    .getByRole("button", { name: "搜索引擎：浏览器默认", exact: true })
    .waitFor()
  await page.locator("[data-pixi-matrix] canvas").waitFor()
  if (errors.length) throw new Error(errors.join("\n"))
  console.log(
    "PASS: actual chrome://newtab override, no runtime or CSP errors."
  )
} finally {
  await context?.close()
  await rm(profile, { recursive: true, force: true })
}
