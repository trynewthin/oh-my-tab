import sharp from "sharp"
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises"

const brand = new URL("../../docs/brand/", import.meta.url)
const icons = new URL("../../public/icons/", import.meta.url)
const source = await readFile(new URL("oh-my-tab-icon.svg", brand), "utf8")
await mkdir(icons, { recursive: true })

const darkPalette = [
  ["#172FEE", "#5A7AFF"],
  ["#1530EC", "#4265FA"],
  ["#102DE7", "#3551E0"],
  ["#4C6FFF", "#9AAEFF"],
  ["#3E5EFA", "#7692FF"],
  ["#21188D", "#3D32B5"],
  ["#1B1584", "#2D249B"],
  ["#FF806C", "#FFA18B"],
  ["#FF6D60", "#FF887B"],
]
const backgrounds = { light: "#FDF7F2", dark: "#191D30" }

// Keep the source paths editable; only normalize the canvas and palette.
function vector(theme, tile) {
  const background = tile
    ? `<g id="background"><rect x="100" y="100" width="1060" height="1060" rx="212" fill="${backgrounds[theme]}"/></g>`
    : ""
  let svg = source
    .replace(/viewBox="[^"]+"/, 'viewBox="100 100 1060 1060"')
    .replace(/<g id="background"[^>]*>[\s\S]*?<\/g>/, background)
  if (theme === "dark")
    for (const [original, color] of darkPalette)
      svg = svg.replaceAll(`stop-color="${original}"`, `stop-color="${color}"`)
  return svg
}

for (const theme of ["light", "dark"]) {
  const suffix = theme === "dark" ? "-dark" : ""
  for (const kind of ["icon", "mark"]) {
    const svg = vector(theme, kind === "icon")
    const name = `oh-my-tab-${kind}-${theme}`
    await writeFile(new URL(`${name}.svg`, brand), svg)
    await sharp(Buffer.from(svg))
      .png()
      .toFile(new URL(`${name}.png`, brand).pathname)
    for (const size of [16, 32, 48, 128])
      await sharp(Buffer.from(svg))
        .resize(size, size)
        .png()
        .toFile(new URL(`${kind}${suffix}-${size}.png`, icons).pathname)
  }
}

// Browsers can adapt the transparent favicon to their own color scheme.
const adaptivePalette = darkPalette
  .map(
    ([original, color]) =>
      `stop[stop-color="${original}"] { stop-color: ${color}; }`
  )
  .join("\n")
await writeFile(
  new URL("mark.svg", icons),
  vector("light", false).replace(
    "</svg>",
    `<style>@media (prefers-color-scheme: dark) { ${adaptivePalette} }</style></svg>`
  )
)
await copyFile(
  new URL("oh-my-tab-icon-light.png", brand),
  new URL("oh-my-tab-icon.png", brand)
)
console.log(
  "Generated light/dark brand icons, transparent marks, and 16/32/48/128 px extension assets"
)
