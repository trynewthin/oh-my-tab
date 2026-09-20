import { defineConfig } from "@playwright/test"
import { existsSync } from "node:fs"
const chrome = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./tests/results/playwright",
  fullyParallel: true,
  use: {
    baseURL: "http://127.0.0.1:4173",
    viewport: { width: 1440, height: 1000 },
    // The UI language is a runtime preference that follows the browser, so an
    // unpinned context resolves `system` to en-US and every zh-CN label
    // assertion in the suite fails. Pin Simplified Chinese here, at the
    // harness level, and let the i18n spec opt into English explicitly.
    locale: "zh-CN",
    launchOptions: {
      executablePath:
        process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ??
        (existsSync(chrome) ? chrome : undefined),
    },
  },
  webServer: {
    command: "npm run preview -- --host 127.0.0.1 --port 4173",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
})
