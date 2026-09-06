import sharp from "sharp"
import { mkdir } from "node:fs/promises"

const source = new URL("../docs/brand/oh-my-tab-icon.png", import.meta.url)
const icons = new URL("../public/icons/", import.meta.url)
await mkdir(icons, { recursive: true })

for (const size of [16, 32, 48, 128]) {
  await sharp(source.pathname)
    .resize(size, size, { kernel: "lanczos3" })
    .png()
    .toFile(new URL(`icon-${size}.png`, icons).pathname)
}
console.log("Generated extension icons (16, 32, 48, 128 px) from docs/brand/oh-my-tab-icon.png")
