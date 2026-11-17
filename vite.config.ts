import { searchSuggestionsProxy } from "./plugins/search-suggestions-proxy.ts"
import { yamlContent } from "./plugins/yaml-content.ts"
import { projectLicenses } from "./plugins/project-licenses.ts"
import path from "path"
import { faviconProxy } from "./plugins/favicon-proxy.ts"
import tailwindcss from "@tailwindcss/vite"
import react, { reactCompilerPreset } from "@vitejs/plugin-react"
import babel from "@rolldown/plugin-babel"
import { defineConfig } from "vite"

export default defineConfig({
  base: "./",
  plugins: [
    yamlContent(),
    projectLicenses(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    faviconProxy(),
    searchSuggestionsProxy(),
  ],
  build: {
    license: { fileName: "THIRD_PARTY_LICENSES.md" },
    rolldownOptions: {
      output: {
        postBanner:
          "/*! Licenses accompany this build: LICENSE, NOTICE and THIRD_PARTY_LICENSES.md. */",
      },
      input: {
        main: path.resolve(import.meta.dirname, "index.html"),
        popup: path.resolve(import.meta.dirname, "popup.html"),
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
})
