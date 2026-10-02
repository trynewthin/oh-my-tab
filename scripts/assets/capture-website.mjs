import { chromium } from "@playwright/test"
import { mkdir } from "node:fs/promises"
import sharp from "sharp"

const appUrl = process.env.SHOWCASE_URL || "http://localhost:5173"
const output = "website/public/showcase"
const now = new Date("2026-10-03T09:41:00+08:00").getTime()

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
  const sky = ["#202442", "#303154", "#48416c", "#70527b", "#a56b88", "#d79499"]
  let color = sky[Math.min(5, Math.floor(y / 3))]
  if ((x === 4 && y === 3) || (x === 19 && y === 2) || (x === 8 && y === 5))
    color = "#f5dfbc"
  if ((x - 16) ** 2 + (y - 8) ** 2 <= 12) color = y < 8 ? "#ffe1ae" : "#f4b18e"
  if (y >= 15 - Math.floor(5 * Math.exp(-((x - 7) ** 2) / 22)))
    color = "#685780"
  if (y >= 17 - Math.floor(5 * Math.exp(-((x - 20) ** 2) / 26)))
    color = "#413c66"
  if (y >= 17) {
    color = y % 2 === 0 ? "#353e60" : "#303650"
    if (Math.abs(x - 16) <= (23 - y) / 3 && y % 2 === 0) color = "#c991a0"
    if ((x + y * 3) % 17 === 0) color = "#657399"
  }
  if (y >= 22 + Math.floor(x / 9) || (x < 3 && y > 19)) color = "#252b42"
  return color
})

const daylightPixels = Array.from({ length: 576 }, (_, index) => {
  const x = index % 24
  const y = Math.floor(index / 24)
  const sky = ["#9acfe0", "#b4deea", "#cce9ed", "#e3efdf", "#f1ecd0", "#eee6bc"]
  let color = sky[Math.min(5, Math.floor(y / 3))]
  if ((x - 17) ** 2 + (y - 6) ** 2 <= 10) color = "#f5cb70"
  if ((y === 4 && x >= 3 && x <= 6) || (y === 5 && x >= 2 && x <= 8))
    color = "#fff7e8"
  if (y >= 15 - Math.floor(5 * Math.exp(-((x - 7) ** 2) / 22)))
    color = "#96bdac"
  if (y >= 17 - Math.floor(5 * Math.exp(-((x - 20) ** 2) / 26)))
    color = "#659e91"
  if (y >= 17) {
    color = y % 2 === 0 ? "#99cdd0" : "#b1dedb"
    if (Math.abs(x - 17) <= (23 - y) / 3 && y % 2 === 0) color = "#f4e8b7"
    if ((x + y * 3) % 17 === 0) color = "#e3f2e7"
  }
  if (y >= 22 + Math.floor(x / 9) || (x < 3 && y > 19)) color = "#729f88"
  return color
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
      { id: "task-3", text: "画一片落日", done: false },
    ],
  },
  {
    id: "canvas",
    kind: "dot-canvas",
    name: "暮色山湖",
    size: "large",
    color: "#70618f",
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

async function capture(
  browser,
  name,
  theme,
  items,
  positions,
  { width, height, clip, columns = 20 } = {}
) {
  if (theme === "light") {
    items = items.map((item) =>
      item.kind === "dot-canvas"
        ? {
            ...item,
            name: "晴日山湖",
            color: "#96bdac",
            pixels: daylightPixels,
          }
        : item
    )
  }
  const context = await browser.newContext({
    viewport: {
      width: width ?? 1500,
      height: height ?? (name.startsWith("home") ? 920 : 460),
    },
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
    ({ theme, items, positions, name, columns }) => {
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
          layouts: { [columns]: positions },
          lastLayoutColumns: columns,
          mockDataVersion: 999,
        },
      }
      for (const [key, state] of Object.entries(states))
        localStorage.setItem(key, JSON.stringify({ state, version: 0 }))
    },
    { theme, items, positions, name, columns }
  )
  const page = await context.newPage()
  await page.clock.install({ time: now })
  await page.goto(appUrl)
  await page.getByRole("combobox").waitFor()
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(1800)
  // Detail shots clip to the union of the target tiles' boxes so no
  // neighbouring chrome (search box, empty track) leaks into the frame.
  let clipRegion = clip
  if (clip === "grid") {
    const box = await page.evaluate(
      (ids) => {
        const tiles = ids
          .map((id) =>
            document
              .querySelector(`[data-grid-item-id="${id}"]`)
              ?.getBoundingClientRect()
          )
          .filter(Boolean)
        if (!tiles.length) return null
        const x = Math.min(...tiles.map((r) => r.x))
        const y = Math.min(...tiles.map((r) => r.y))
        return {
          x,
          y,
          width: Math.max(...tiles.map((r) => r.x + r.width)) - x,
          height: Math.max(...tiles.map((r) => r.y + r.height)) - y,
        }
      },
      items.map((item) => item.id)
    )
    clipRegion = box ?? undefined
  }
  const screenshot = await page.screenshot(
    clipRegion ? { clip: clipRegion } : undefined
  )
  await sharp(screenshot).webp({ quality: 90 }).toFile(`${output}/${name}.webp`)
  if (name === "detail-colors" || name === "detail-colors-light") {
    for (const item of items) {
      const tile = page.locator(`[data-grid-item-id="${item.id}"]`)
      const radius = await tile.evaluate((element) => {
        const style = getComputedStyle(element)
        return (
          parseFloat(style.borderTopLeftRadius) /
          element.getBoundingClientRect().height
        )
      })
      const image = await tile.screenshot()
      const { width, height } = await sharp(image).metadata()
      const mask = Buffer.from(
        `<svg width="${width}" height="${height}"><rect width="${width}" height="${height}" rx="${radius * height}" fill="white"/></svg>`
      )
      await sharp(image)
        .ensureAlpha()
        .composite([{ input: mask, blend: "dest-in" }])
        .webp({ quality: 90, alphaQuality: 100 })
        .toFile(
          `${output}/detail-${item.id.replace("d-", "")}${theme === "light" ? "-light" : ""}.webp`
        )
    }
  }
  await context.close()
}

await mkdir(output, { recursive: true })
const browser = await chromium.launch()
for (const theme of ["dark", "light"]) {
  await capture(
    browser,
    `organize-${theme}`,
    theme,
    organizeItems,
    layouts.organize
  )
  await capture(
    browser,
    `widgets-${theme}`,
    theme,
    widgetItems,
    layouts.widgets
  )
}
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

// Detail cards get their own tightly-framed captures so the landing page
// never crops a wide shot — cropping bled neighbouring tiles' borders into
// the frame. Each scene uses an 8-column grid at a ~628px viewport.
const detailScenes = [
  {
    name: "detail-colors",
    theme: "dark",
    items: [
      tab("d-github", "GitHub", "https://github.com", "#9788c8"),
      tab("d-notion", "Notion", "https://notion.so", "#7394ad"),
      tab("d-spotify", "Spotify", "https://open.spotify.com", "#79ab90"),
    ],
    positions: {
      "d-github": { x: 0, y: 0 },
      "d-notion": { x: 0, y: 1 },
      "d-spotify": { x: 0, y: 2 },
    },
    columns: 8,
  },
  {
    name: "detail-todos",
    theme: "dark",
    items: [widgetItems[1]],
    positions: { todo: { x: 0, y: 0 } },
    columns: 8,
  },
  {
    name: "detail-calendar",
    theme: "dark",
    items: [widgetItems[0]],
    positions: { calendar: { x: 0, y: 0 } },
    columns: 8,
  },
  {
    name: "detail-plant",
    theme: "dark",
    items: [widgetItems[2]],
    positions: { canvas: { x: 0, y: 0 } },
    columns: 8,
  },
]
for (const scene of detailScenes) {
  await capture(
    browser,
    scene.name,
    scene.theme,
    scene.items,
    scene.positions,
    {
      width: 628,
      height: 460,
      clip: "grid",
      columns: scene.columns,
    }
  )
}
for (const scene of detailScenes) {
  await capture(
    browser,
    `${scene.name}-light`,
    "light",
    scene.items,
    scene.positions,
    {
      width: 628,
      height: 460,
      clip: "grid",
      columns: scene.columns,
    }
  )
}
await browser.close()

console.log("Created product and detail screenshots.")
