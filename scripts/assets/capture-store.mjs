import { chromium } from "@playwright/test"
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
const out = "docs/store-assets"
await mkdir(out, { recursive: true })
const captureOut = await mkdtemp(join(tmpdir(), "oh-my-tab-store-"))
const browser = await chromium.launch({
  executablePath:
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
})
const entries = [
  ["GitHub", "github.com", "#9584ce"],
  ["Figma", "figma.com", "#ce9471"],
  ["Notion", "notion.so", "#6e96b6"],
  ["YouTube", "youtube.com", "#bd7786"],
  ["Spotify", "open.spotify.com", "#71b793"],
  ["Linear", "linear.app", "#8b8bd1"],
  ["Dribbble", "dribbble.com", "#b9839a"],
  ["Behance", "behance.net", "#779bd1"],
  ["Unsplash", "unsplash.com", "#86a697"],
  ["MDN", "developer.mozilla.org", "#bba076"],
]
const tab = (i) => ({
  id: "new-" + i,
  kind: "tab",
  name: entries[i][0],
  url: "https://" + entries[i][1],
  color: entries[i][2],
  size: "small",
})
const folder = (id, name, ids, color) => ({
  id,
  kind: "folder",
  name,
  tabs: ids.map(tab),
  color,
  size: "large",
  dynamicEffect: true,
})
const home = [
  folder("daily", "日常工作", [0, 2, 5, 9], "#7b9fb3"),
  folder("ideas", "灵感收藏", [1, 6, 7, 8], "#b19ac4"),
  ...Array.from({ length: 6 }, (_, i) => tab(i)),
]
const pos = {
  daily: { x: 0, y: 0 },
  ideas: { x: 4, y: 0 },
  "new-0": { x: 8, y: 0 },
  "new-1": { x: 8, y: 1 },
  "new-2": { x: 8, y: 2 },
  "new-3": { x: 0, y: 4 },
  "new-4": { x: 4, y: 4 },
  "new-5": { x: 8, y: 4 },
}
const icons = new Map()
await Promise.all(
  entries.map(async (e) => {
    try {
      const r = await fetch(
        "https://icons.duckduckgo.com/ip3/" + e[1] + ".ico",
        { signal: AbortSignal.timeout(8000) }
      )
      if (r.ok)
        icons.set(e[1], {
          body: Buffer.from(await r.arrayBuffer()),
          contentType: r.headers.get("content-type") || "image/x-icon",
        })
    } catch {}
  })
)
async function capture(name, theme, items = home, positions = pos, action) {
  const ctx = await browser.newContext({
    viewport: { width: 1000, height: 820 },
    deviceScaleFactor: 1.6,
    reducedMotion: "reduce",
  })
  await ctx.route("**/__favicon?**", (r) => {
    const q = new URL(r.request().url()).searchParams
    if (q.get("kind") === "page")
      return r.fulfill({ body: "<html></html>", contentType: "text/html" })
    const u = q.get("url") || q.get("origin")
    let icon
    try {
      icon = icons.get(new URL(u).hostname.replace(/^www\./, ""))
    } catch {}
    return r.fulfill(
      icon ? { status: 200, ...icon } : { status: 404, body: "" }
    )
  })
  await ctx.addInitScript(
    ({ theme, items, positions }) => {
      for (const [key, state] of Object.entries({
        "omt.privacy": { icons: true, suggestions: false, browserSearch: true },
        "omt.onboarding": { seen: true },
        "omt.theme-mode": { theme },
        "omt.home-settings": {
          backgroundPalette: theme === "dark" ? "slate" : "sand",
          searchBoxStyle: "minimal",
          topComponent: "dot-matrix",
          content: "text",
          text: "MAKE ROOM",
          color: theme === "dark" ? "#9baddd" : "#967cad",
          folderStyle: "noise",
          effectStyle: "burning",
          burningAmplitude: 0.65,
        },
        "omt.tab-grid": {
          items,
          layouts: { 12: positions },
          lastLayoutColumns: 12,
          mockDataVersion: 999,
        },
      }))
        localStorage.setItem(key, JSON.stringify({ state, version: 0 }))
    },
    { theme, items, positions }
  )
  const p = await ctx.newPage()
  await p.goto(process.env.SHOWCASE_URL || "http://127.0.0.1:5173")
  await p.getByRole("combobox").waitFor()
  await p.evaluate(() => document.fonts.ready)
  await p.waitForTimeout(2200)
  if (action) await action(p)
  await p.mouse.move(1, 1)
  await p.screenshot({ path: `${captureOut}/${name}.png` })
  await ctx.close()
}
await capture("capture-light", "light")
await capture("capture-dark", "dark")
await capture("capture-folder", "light", home, pos, async (p) => {
  await p.getByRole("button", { name: "灵感收藏", exact: true }).click()
  await p.getByRole("dialog", { name: "灵感收藏", exact: true }).waitFor()
  await p.waitForTimeout(400)
})
const pixels = Array.from({ length: 576 }, (_, i) => {
  const x = i % 24,
    y = Math.floor(i / 24)
  if (y >= 12 && y <= 21 && x === 12) return "#73a67d"
  if ((y === 16 && x >= 9 && x <= 11) || (y === 18 && x >= 13 && x <= 15))
    return "#8cb88b"
  if (Math.abs(x - 12) + Math.abs(y - 9) <= 2) return "#e5b762"
  if (
    (x - 12) ** 2 + (y - 6) ** 2 < 9 ||
    (x - 9) ** 2 + (y - 10) ** 2 < 9 ||
    (x - 15) ** 2 + (y - 10) ** 2 < 9 ||
    (x - 12) ** 2 + (y - 12) ** 2 < 7
  )
    return "#d59ec2"
  return "#242932"
})
const playful = [
  {
    id: "flower",
    kind: "ecosystem",
    name: "窗边小花",
    size: "large",
    color: "#95bba3",
    species: "flowers",
    plants: [
      {
        slot: 0,
        species: "flowers",
        seed: 718,
        appearanceVersion: 2,
        plantedAt: Date.now() - 86400000 * 3,
        boost: 10,
      },
    ],
    points: 60,
    pointsUpdatedAt: Date.now(),
  },
  {
    id: "art",
    kind: "dot-canvas",
    name: "今天画朵花",
    size: "large",
    color: "#c795b7",
    pixelColumns: 24,
    pixels,
  },
  folder("ideas", "灵感收藏", [1, 6, 7, 8], "#b19ac4"),
]
await capture("capture-play", "dark", playful, {
  flower: { x: 0, y: 0 },
  art: { x: 4, y: 0 },
  ideas: { x: 8, y: 0 },
})
const data = async (file) =>
  "data:image/png;base64," + (await readFile(file)).toString("base64")
const light = await data(`${captureOut}/capture-light.png`),
  dark = await data(`${captureOut}/capture-dark.png`)
const icon = await data("public/icons/icon-128.png")
const ctx = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 1,
})
const page = await ctx.newPage()
const slides = [
  [
    "01-home",
    "dark",
    "每天的新标签页，<br>认真布置一下。",
    "把搜索、常用网站和一点小爱好，放在一起。",
    null,
    ["自由布局", "深浅主题", "像素组件"],
  ],
  [
    "02-light",
    "light",
    "把页面<br>留得轻一点",
    "温暖底色与柔和卡片，让常用网站各有位置。",
    light,
    ["简约搜索", "背景自定义", "主题配色"],
  ],
  [
    "03-dark",
    "dark",
    "让细节<br>慢慢浮出来",
    "柔和光晕、颗粒质感，打造自己的起始页。",
    dark,
    ["深色界面", "可调动效", "电子点阵"],
  ],
  [
    "04-organize",
    "light",
    "常用网站，<br>各有位置",
    "用文件夹收起一组灵感，按自己的习惯整理。",
    await data(`${captureOut}/capture-folder.png`),
    ["拖拽排列", "多选整理", "书签导入"],
  ],
  [
    "05-play",
    "dark",
    "在主页，<br>养一点小乐趣",
    "一盆慢慢长大的植物，一朵自己画的点阵花。",
    await data(`${captureOut}/capture-play.png`),
    ["浇水施肥", "成长图鉴", "点阵画布"],
  ],
]
const base = (isDark) =>
  `*{box-sizing:border-box}body{margin:0;font-family:'PingFang SC',system-ui,sans-serif;background:${isDark ? "#171a23" : "#f3f1eb"};color:${isDark ? "#eeeef4" : "#333743"}}.page{width:1280px;height:800px;position:relative;padding:40px 48px;background:radial-gradient(ellipse at 90% 0,${isDark ? "#49506a50" : "#d9d2e57a"},transparent 65%)}header{display:flex;align-items:center;gap:12px;letter-spacing:3px;font-size:20px}header img{width:32px;height:32px}h1{font-size:38px;line-height:1.4;letter-spacing:-1px;margin:0 0 22px;font-weight:600}p{font-size:19px;line-height:1.9;opacity:.65;margin:0;max-width:305px}.copy{position:absolute;left:48px;top:245px;width:320px}.tags{display:flex;flex-wrap:wrap;gap:10px;margin-top:32px;max-width:310px}.tags span{border:1px solid ${isDark ? "#ffffff28" : "#33374325"};border-radius:25px;padding:9px 15px;font-size:15px;opacity:.8}.shot{position:absolute;overflow:hidden;border:1px solid ${isDark ? "#ffffff25" : "#272b4020"};border-radius:18px;box-shadow:0 22px 50px #0002;right:40px;top:112px;width:780px}.shot img{display:block;width:100%}.duo .shot{width:655px;right:90px;top:132px;transform:rotate(-4deg)}.duo .shot:last-child{width:655px;right:35px;top:350px;transform:rotate(3deg)}.duo .shot img{height:400px;object-fit:cover;object-position:top}.label{font-size:13px;letter-spacing:2px;padding:11px 16px;background:#262b3a;color:#d8dce9}footer{position:absolute;bottom:28px;left:48px;font-size:13px;opacity:.45;letter-spacing:1px}`
async function render(name, html, width = 1280, height = 800) {
  await page.setViewportSize({ width, height })
  await page.setContent(html)
  await page.evaluate(() => document.fonts.ready)
  await page.screenshot({ path: `${out}/${name}.png` })
}
for (const [name, theme, title, sub, src, tags] of slides) {
  const d = theme === "dark"
  await render(
    name,
    `<html lang="zh-CN"><meta charset="utf-8"><style>${base(d)}</style><div class="page"><header><img src="${icon}"><b>OH MY TAB</b></header><div class="copy"><h1>${title}</h1><p>${sub}</p><div class="tags">${tags.map((t) => `<span>${t}</span>`).join("")}</div></div>${src ? `<div class="shot"><img src="${src}"></div>` : `<div class="duo"><div class="shot"><div class="label">LIGHT · 浅色</div><img src="${light}"></div><div class="shot"><div class="label">DARK · 深色</div><img src="${dark}"></div></div>`}<footer>真实界面 · 示例内容</footer></div></html>`
  )
}
for (const [name, width, height] of [
  ["promo-small", 440, 280],
  ["promo-marquee", 1400, 560],
]) {
  const small = width === 440
  await render(
    name,
    `<html><style>*{box-sizing:border-box}body{margin:0;background:#202333;color:#f1eff7;font-family:'PingFang SC',system-ui,sans-serif}.promo{position:relative;width:${width}px;height:${height}px;overflow:hidden;background:radial-gradient(ellipse at 85% 20%,#71668a80,transparent 70%)}.brand{position:absolute;left:${small ? 25 : 70}px;top:${small ? 26 : 130}px;z-index:2}.brand img{width:${small ? 48 : 90}px;height:${small ? 48 : 90}px;display:block;margin-bottom:${small ? 14 : 25}px}.brand b{font-size:${small ? 25 : 49}px;letter-spacing:${small ? 1 : 2}px;font-weight:600}.screen{position:absolute;right:${small ? -55 : 35}px;top:${small ? 125 : 65}px;width:${small ? 335 : 750}px;border:1px solid #ffffff30;border-radius:${small ? 10 : 18}px;overflow:hidden;transform:rotate(-7deg);box-shadow:0 20px 45px #0005}.screen img{width:100%;display:block}.back{right:${small ? 120 : 185}px;top:${small ? 168 : 190}px;transform:rotate(7deg);opacity:.65}</style><div class="promo"><div class="brand"><img src="${icon}"><b>Oh My Tab</b></div><div class="screen back"><img src="${light}"></div><div class="screen"><img src="${dark}"></div></div></html>`,
    width,
    height
  )
}
await browser.close()
// Store requires opaque RGB PNGs, including screenshots rendered by Chromium.
const sharp = (await import("sharp")).default
const expectedOutputs = [
  ...slides.map(([name]) => [name, 1280, 800]),
  ["promo-small", 440, 280],
  ["promo-marquee", 1400, 560],
]
for (const [name, expectedWidth, expectedHeight] of expectedOutputs) {
  const file = `${out}/${name}.png`,
    buffer = await sharp(file)
      .flatten({ background: "#171a23" })
      .removeAlpha()
      .png()
      .toBuffer()
  await writeFile(file, buffer)
  const metadata = await sharp(buffer).metadata()
  if (metadata.channels !== 3) throw new Error(`Expected RGB PNG: ${file}`)
  if (metadata.width !== expectedWidth || metadata.height !== expectedHeight)
    throw new Error(`Expected ${expectedWidth}×${expectedHeight} PNG: ${file}`)
}
await rm(captureOut, { recursive: true, force: true })
console.log(
  "Created five 1280×800 screenshots and two opaque promotional tiles."
)
