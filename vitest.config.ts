import { mergeConfig } from "vitest/config"
import { defineConfig } from "vitest/config"
import viteConfig from "./vite.config.ts"

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      include: ["tests/unit/**/*.test.ts"],
      environment: "node",
      setupFiles: ["tests/unit/setup.ts"],
    },
  })
)
