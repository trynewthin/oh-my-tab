import { chromium } from "@playwright/test"
import { mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import path from "node:path"
const profile = await mkdtemp(path.join(tmpdir(), "oh-my-tab-verify-"))
let context
try {
  const extension = path.resolve("dist")
  context = await chromium.launchPersistentContext(profile, {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
    headless: true,
    channel: "chromium",
    args: [
      `--disable-extensions-except=${extension}`,
      `--load-extension=${extension}`,
    ],
    viewport: { width: 1440, height: 1000 },
  })
  const page = await context.newPage()
  const errors = []
  page.on("pageerror", (error) => errors.push(error.message))
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text())
  })
  await page.goto("chrome://newtab/")
  await page.getByRole("combobox", { name: "对话输入" }).waitFor()
  await page.screenshot({
    path: "artifacts/newtab-extension.png",
    fullPage: true,
  })
  if (errors.length) throw new Error(errors.join("\n"))
  console.log(
    "PASS: actual chrome://newtab override, no runtime or CSP errors."
  )
} finally {
  await context?.close()
  await rm(profile, { recursive: true, force: true })
}
