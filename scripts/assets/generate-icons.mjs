import sharp from "sharp"
import { mkdir, readFile } from "node:fs/promises"

const source = new URL("../../docs/brand/oh-my-tab-icon.svg", import.meta.url)
const brand = new URL("../../docs/brand/oh-my-tab-icon.png", import.meta.url)
const icons = new URL("../../public/icons/", import.meta.url)
await mkdir(icons, { recursive: true })

const svg = await readFile(source, "utf8")
const artwork = await sharp(
  Buffer.from(
    svg.replace("</svg>", "<style>#background { display: none; }</style></svg>")
  ),
  { density: 144 }
)
  .trim()
  .png()
  .toBuffer()

for (const size of [16, 32, 48, 128, 1024]) {
  const padding = size / 16
  const foreground = await sharp(artwork)
    .resize(size - padding * 2, size - padding * 2, {
      fit: "contain",
      background: "#00000000",
      kernel: "lanczos3",
    })
    .png()
    .toBuffer()
  const background = Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}"><rect width="${size}" height="${size}" rx="${size / 5}" fill="#FDF7F2"/></svg>`
  )
  const target = size === 1024 ? brand : new URL(`icon-${size}.png`, icons)
  await sharp(background)
    .composite([{ input: foreground, left: padding, top: padding }])
    .png()
    .toFile(target.pathname)
}
console.log(
  "Generated brand PNG and extension icons (16, 32, 48, 128 px) from docs/brand/oh-my-tab-icon.svg"
)
