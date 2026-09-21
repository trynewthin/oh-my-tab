import { chromium } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import sharp from "sharp"

const appUrl = process.env.SHOWCASE_URL || "http://localhost:5173"
const output = "website/public/showcase"
const now = new Date("2026-09-13T09:41:00+08:00").getTime()

const tab = (id, name, url, color = "#7d91bd") => ({
  id,
  kind: "tab",
  name,
  url,
  size: "small",
  color,
})

const work = {
  id: "work",
  kind: "folder",
  name: "工作台",
  size: "large",
  color: "#7da99f",
  tabs: [
    tab("react", "React", "https://react.dev"),
    tab("vite", "Vite", "https://vite.dev"),
    tab("typescript", "TypeScript", "https://typescriptlang.org"),
    tab("tailwind", "Tailwind CSS", "https://tailwindcss.com"),
    tab("mdn", "MDN Web Docs", "https://developer.mozilla.org"),
    tab("github-docs", "GitHub Docs", "https://docs.github.com"),
  ],
}

const organizeItems = [
  work,
  {
    id: "ideas",
    kind: "folder",
    name: "灵感收藏",
    size: "large",
    color: "#b391c1",
    tabs: [
      tab("figma", "Figma", "https://figma.com"),
      tab("dribbble", "Dribbble", "https://dribbble.com"),
      tab("behance", "Behance", "https://behance.net"),
      tab("unsplash", "Unsplash", "https://unsplash.com"),
    ],
  },
  tab("github", "GitHub", "https://github.com", "#9788c8"),
  tab("notion", "Notion", "https://notion.so", "#7394ad"),
  tab("linear", "Linear", "https://linear.app", "#7d82c7"),
  tab("youtube", "YouTube", "https://youtube.com", "#c98291"),
  tab("spotify", "Spotify", "https://open.spotify.com", "#79ab90"),
  tab("pinterest", "Pinterest", "https://pinterest.com", "#c38c9e"),
  tab("wikipedia", "Wikipedia", "https://wikipedia.org", "#9a9aaf"),
  tab("read", "MDN Web Docs", "https://developer.mozilla.org", "#b8a17e"),
]

const pixels = Array.from({ length: 576 }, (_, index) => {
  const x = index % 24
  const y = Math.floor(index / 24)
  if (y >= 11 && y <= 21 && x === 12) return "#79a47e"
  if (Math.abs(x - 12) + Math.abs(y - 8) <= 1) return "#e5bd67"
  if (Math.abs(x - 12) + Math.abs(y - 8) <= 3) return "#d79dc4"
  return ""
})

const widgetItems = [
  {
    id: "calendar",
    kind: "calendar",
    name: "日历",
    size: "large",
    color: "#d88e91",
  },
  {
    id: "todo",
    kind: "todo",
    name: "今天",
    size: "large",
    color: "#8b9fc8",
    tasks: [
      { id: "task-1", text: "整理今天的工作", done: true },
      { id: "task-2", text: "读完收藏的文章", done: false },
      { id: "task-3", text: "给植物浇水", done: false },
    ],
  },
  {
    id: "garden",
    kind: "ecosystem",
    name: "窗边小花",
    size: "large",
    color: "#83aa91",
    species: "flowers",
    plants: [
      {
        slot: 0,
        species: "flowers",
        seed: 718,
        appearanceVersion: 2,
        plantedAt: now - 4 * 86400000,
        boost: 12,
      },
    ],
  },
  {
    id: "canvas",
    kind: "dot-canvas",
    name: "今天画朵花",
    size: "large",
    color: "#c795b7",
    pixelColumns: 24,
    pixels,
  },
]

// Folders and tabs are separated by an empty grid column so neighbouring
// tiles never touch in the screenshot — previously adjacent tile borders
// rendered as stray frames inside other components.
const organizeLayout = Object.fromEntries([
  ["work", { x: 0, y: 0 }],
  ["ideas", { x: 4, y: 0 }],
  ...organizeItems
    .slice(2)
    .map((item, index) => [
      item.id,
      { x: 9 + Math.floor(index / 4) * 4, y: index % 4 },
    ]),
])
// One empty column between each 4-wide widget.
const widgetLayout = Object.fromEntries(
  widgetItems.map((item, index) => [item.id, { x: index * 5, y: 0 }])
)
const homeLayout = {
  ...organizeLayout,
  ...Object.fromEntries(
    widgetItems.map((item, index) => [item.id, { x: index * 5, y: 5 }])
  ),
}
const layouts = { organize: organizeLayout, widgets: widgetLayout }
const icons = new Map()
const hosts = [
  ...new Set(
    organizeItems
      .flatMap((item) => item.tabs || [item])
      .map((item) => new URL(item.url).hostname)
  ),
]
await Promise.all(
  hosts.map(async (host) => {
    let response = await fetch(`https://icons.duckduckgo.com/ip3/${host}.ico`, {
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok)
      response = await fetch(
        `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
        { signal: AbortSignal.timeout(15000) }
      )
    if (!response.ok) throw new Error(`Missing showcase icon: ${host}`)
    icons.set(host, {
      body: Buffer.from(await response.arrayBuffer()),
      contentType: response.headers.get("content-type") || "image/x-icon",
    })
  })
)

async function capture(browser, name, theme, items, positions, action) {
  const context = await browser.newContext({
    viewport: { width: 1500, height: name.startsWith("home") ? 920 : 460 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  })
  await context.route("**/__favicon?**", (route) => {
    const query = new URL(route.request().url()).searchParams
    if (query.get("kind") === "page")
      return route.fulfill({ body: "<html></html>", contentType: "text/html" })
    const url = query.get("url") || query.get("origin")
    const icon = url && icons.get(new URL(url).hostname)
    return route.fulfill(
      icon ? { status: 200, ...icon } : { status: 404, body: "" }
    )
  })
  await context.addInitScript(
    ({ theme, items, positions, name }) => {
      const states = {
        "omt.onboarding": { seen: true },
        "omt.privacy": {
          icons: true,
          suggestions: false,
          browserSearch: true,
        },
        "omt.theme-mode": { theme },
        "omt.home-settings": {
          backgroundPalette: theme === "dark" ? "slate" : "sand",
          searchBoxStyle: "minimal",
          topComponent: name.startsWith("home") ? "dot-matrix" : "none",
          content: "text",
          text: "MAKE ROOM",
          color: theme === "dark" ? "#9baddd" : "#967cad",
          folderStyle: "noise",
          effectStyle: "burning",
        },
        "omt.tab-grid": {
          items,
          layouts: { 20: positions },
          lastLayoutColumns: 20,
          mockDataVersion: 999,
        },
      }
      for (const [key, state] of Object.entries(states))
        localStorage.setItem(key, JSON.stringify({ state, version: 0 }))
    },
    { theme, items, positions, name }
  )
  const page = await context.newPage()
  await page.clock.install({ time: now })
  await page.goto(appUrl)
  await page.getByRole("combobox").waitFor()
  await page.evaluate(() => document.fonts.ready)
  if (action) await action(page)
  await page.waitForTimeout(1800)
  const screenshot = await page.screenshot()
  await sharp(screenshot).webp({ quality: 90 }).toFile(`${output}/${name}.webp`)
  await context.close()
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
await capture(browser, "organize", "light", organizeItems, layouts.organize)
await capture(browser, "widgets", "dark", widgetItems, layouts.widgets)
await capture(
  browser,
  "home-dark",
  "dark",
  [...organizeItems, ...widgetItems],
  homeLayout
)
await capture(
  browser,
  "home-light",
  "light",
  [...organizeItems, ...widgetItems],
  homeLayout
)
await browser.close()

console.log("Created four high-resolution product screenshots.")
