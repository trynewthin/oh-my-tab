import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const root = import.meta.dirname

// Vercel's `cleanUrls` maps extensionless paths onto `<name>.html` files in
// production. Vite's dev and preview servers need the same mapping so the
// language switcher and the `#features` anchors behave identically locally.
// Flat `.html` files are used for every route because Vercel's clean-URL
// handling only rewrites `name.html`, not nested `dir/index.html`.
const cleanUrlTargets: Record<string, string> = {
  "/": "/index.html",
  "/privacy": "/privacy.html",
  "/en": "/en/index.html",
  "/en/privacy": "/en/privacy.html",
}

function cleanUrls(): Plugin {
  const rewrite = (url: string | undefined) => {
    if (!url) return url
    const [pathname, query] = url.split("?")
    const normalized =
      pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname
    const target = cleanUrlTargets[normalized]
    if (!target) return url
    return query ? `${target}?${query}` : target
  }

  const middleware = (req: { url?: string }, _res: unknown, next: () => void) => {
    req.url = rewrite(req.url)
    next()
  }

  return {
    name: "website-clean-urls",
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig({
  plugins: [react(), cleanUrls()],
  build: {
    rollupOptions: {
      input: {
        home: path.resolve(root, "index.html"),
        privacy: path.resolve(root, "privacy.html"),
        homeEn: path.resolve(root, "en/index.html"),
        privacyEn: path.resolve(root, "en/privacy.html"),
      },
    },
  },
})
