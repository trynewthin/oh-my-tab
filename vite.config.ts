import { searchSuggestionsProxy } from "./plugins/search-suggestions-proxy.ts"
import path from "path"
import { faviconProxy } from "./plugins/favicon-proxy.ts"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

// https://vite.dev/config/
export default defineConfig({
  base: "./",
  plugins: [react(), tailwindcss(), faviconProxy(), searchSuggestionsProxy()],
  build: {
    rolldownOptions: {
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
