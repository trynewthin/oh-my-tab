import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(import.meta.dirname, "index.html"),
        privacy: path.resolve(import.meta.dirname, "privacy.html"),
      },
    },
  },
})
