import {
  defaultFairIsleSettings,
  type FairIsleMotif,
  type FairIsleSettings,
} from "@/lib/fair-isle-settings"

const columns = 96
export const FAIR_ISLE_ROW_RATIO = 0.82

type Motif = {
  period: number
  height: number
  stitch: (x: number, y: number) => boolean
}

const starPoints = Array.from({ length: 16 }, (_, i) => {
  const angle = -Math.PI / 2 + (i * Math.PI) / 8
  const radius = i % 2 ? 3.25 : 7.6
  return [7.5 + Math.cos(angle) * radius, 7.5 + Math.sin(angle) * radius]
})

function insideStar(x: number, y: number) {
  let inside = false
  for (let i = 0, j = starPoints.length - 1; i < starPoints.length; j = i++) {
    const [xi, yi] = starPoints[i]
    const [xj, yj] = starPoints[j]
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside
  }
  return inside
}

const pixelMotif = (period: number, rows: readonly string[]): Motif => ({
  period,
  height: rows.length,
  stitch: (x, y) => rows[y][x] === "#",
})

const snowflake = pixelMotif(16, [
  ".......#.......",
  "...#...#...#...",
  "....#..#..#....",
  ".#...#.#.#...#.",
  "..#...###...#..",
  "...#...#...#...",
  "....#..#..#....",
  "###############",
  "....#..#..#....",
  "...#...#...#...",
  "..#...###...#..",
  ".#...#.#.#...#.",
  "....#..#..#....",
  "...#...#...#...",
  ".......#.......",
])

const motifs = {
  star: {
    period: 16,
    height: 15,
    stitch: (x, y) => insideStar(x + 0.5, y + 0.5) && (x !== 7 || y !== 7),
  },
  snowflake,
  diamond: {
    period: 16,
    height: 13,
    stitch: (x, y) => {
      const distance = Math.abs(x - 7) + Math.abs(y - 6)
      return distance === 6 || distance === 5 || distance <= 1
    },
  },
  cross: {
    period: 8,
    height: 7,
    stitch: (x, y) =>
      (x === 3 && y >= 1 && y <= 5) || (y === 3 && x >= 1 && x <= 5),
  },
  zigzag: {
    period: 12,
    height: 7,
    stitch: (x, y) => {
      const peak = Math.min(x, 11 - x)
      return y === peak || y === peak + 1
    },
  },
  checker: {
    period: 8,
    height: 6,
    stitch: (x, y) => (Math.floor(x / 2) + Math.floor(y / 2)) % 2 === 0,
  },
  tree: pixelMotif(12, [
    ".....#.....",
    "....###....",
    "...#####...",
    "..#######..",
    "....###....",
    "...#####...",
    "..#######..",
    ".#########.",
    "...#####...",
    "..#######..",
    ".#########.",
    ".....#.....",
    "....###....",
  ]),
  heart: pixelMotif(12, [
    "..##...##..",
    ".####.####.",
    "###########",
    "###########",
    ".#########.",
    "..#######..",
    "...#####...",
    "....###....",
    ".....#.....",
  ]),
  flower: {
    period: 16,
    height: 13,
    stitch: (x, y) => {
      const ax = Math.abs(x - 7)
      const ay = Math.abs(y - 6)
      return (
        ((ax <= 1 && ay <= 5) ||
          (ay <= 1 && ax <= 5) ||
          (ax >= 2 && ax <= 4 && ay >= 2 && ay <= 4 && ax + ay <= 7)) &&
        !(ax <= 1 && ay <= 1)
      )
    },
  },
  deer: pixelMotif(24, [
    "...............#...#....",
    "..............##.#.##...",
    "...............#####....",
    ".................#......",
    "................###.....",
    "...............#####....",
    "................###.....",
    "...#..........####......",
    "..##..###########.......",
    "...##############.......",
    "....############........",
    "....############........",
    ".....##......##.........",
    ".....##......##.........",
    "....##........##........",
    "....#..........#........",
    "...##..........##.......",
  ]),
} satisfies Record<FairIsleMotif, Motif>

function seededRandom(seed: string) {
  let hash = 2166136261
  for (let index = 0; index < seed.length; index++)
    hash = Math.imul(hash ^ seed.charCodeAt(index), 16777619)
  return () => {
    hash = (hash + 0x6d2b79f5) | 0
    let value = Math.imul(hash ^ (hash >>> 15), hash | 1)
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61)
    return ((value ^ (value >>> 14)) >>> 0) / 2 ** 32
  }
}

function colorChannels(hex: string) {
  const rgb = Number.parseInt(hex.slice(1), 16)
  return [(rgb >>> 16) & 255, (rgb >>> 8) & 255, rgb & 255]
}

function luminance(hex: string) {
  const [red, green, blue] = colorChannels(hex).map((channel) => {
    const value = channel / 255
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

function shuffle<T>(values: readonly T[], random: () => number) {
  const result = [...values]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export function createFairIsleSeed() {
  return crypto
    .getRandomValues(new Uint32Array(1))[0]
    .toString(36)
    .toUpperCase()
    .padStart(7, "0")
}

function hslHex(hue: number, saturation: number, lightness: number) {
  const h = (((hue % 360) + 360) % 360) / 30
  const l = lightness / 100
  const a = (saturation / 100) * Math.min(l, 1 - l)
  return (
    "#" +
    [0, 8, 4]
      .map((channel) => {
        const k = (channel + h) % 12
        const value = l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))
        return Math.round(value * 255)
          .toString(16)
          .padStart(2, "0")
      })
      .join("")
  )
}

export function randomFairIslePalette(count: number) {
  const random = seededRandom(createFairIsleSeed())
  const hue = Math.floor(random() * 360)
  const colorful = random() > 0.55
  const light = random() > 0.73
  const dark = hslHex(hue, 22 + random() * 25, 14 + random() * 10)
  const cream = hslHex(
    hue + 145 + random() * 65,
    22 + random() * 30,
    86 + random() * 7
  )
  const colors = light ? [cream, dark] : [dark, cream]
  const steps = shuffle([25, 65, 125, 175, 215, 270], random)
  for (let i = 0; colors.length < count; i++)
    colors.push(
      hslHex(
        hue + steps[i] + random() * 20,
        (colorful ? 56 : 28) + random() * 22,
        43 + random() * 27
      )
    )
  return colors
}

type Band = {
  name: FairIsleMotif
  bg: number
  fg: number
  trim: number
  shift: number
  divider: number
}

type StitchChartOptions = Pick<
  FairIsleSettings,
  "seed" | "motifs" | "colors" | "bands" | "symmetry"
>
type TextureOptions = StitchChartOptions & Pick<FairIsleSettings, "mode">

function createStitchChart({
  seed,
  motifs: selected,
  colors,
  bands,
  symmetry,
}: StitchChartOptions) {
  const geometry = seededRandom(`${seed}|geometry|${selected.join(",")}`)
  const coloring = seededRandom(`${seed}|yarn`)
  const brightness = colors.map(luminance)
  const rows: Uint8Array[] = []
  const sequence: Band[] = []
  let bag: FairIsleMotif[] = []
  let featureRow = 0

  const foreground = (bg: number, preferred: number) => {
    const contrast = (value: number) =>
      (Math.max(value, brightness[bg]) + 0.05) /
      (Math.min(value, brightness[bg]) + 0.05)
    if (preferred !== bg && contrast(brightness[preferred]) >= 2.65)
      return preferred
    const candidates = brightness
      .map((value, index) => ({ index, contrast: contrast(value) }))
      .filter(({ index }) => index !== bg)
      .sort((a, b) => b.contrast - a.contrast)
    const strong = candidates.filter((candidate) => candidate.contrast >= 2.65)
    const pool = strong.length ? strong : candidates.slice(0, 2)
    return pool[Math.floor(coloring() * pool.length)].index
  }

  const append = (bg: number, fg = bg, stitch?: (x: number) => boolean) => {
    rows.push(
      Uint8Array.from({ length: columns }, (_, x) => (stitch?.(x) ? fg : bg))
    )
  }

  const count = symmetry ? Math.ceil(bands / 2) : bands
  for (let band = 0; band < count; band++) {
    if (!bag.length) bag = shuffle(selected, geometry)
    let name = bag.shift()!
    if (name === sequence.at(-1)?.name && bag.length) {
      bag.push(name)
      name = bag.shift()!
    }
    const bg =
      band === 0 || coloring() < 0.66
        ? 0
        : Math.floor(coloring() * colors.length)
    const fg = foreground(bg, band % 2 ? 1 : 2)
    const trim = foreground(bg, (band + 3) % colors.length)
    sequence.push({
      name,
      bg,
      fg,
      trim,
      shift: Math.floor(geometry() * 2) * (motifs[name].period / 2),
      divider: Math.floor(geometry() * 3),
    })
  }
  if (symmetry)
    sequence.push(...sequence.slice(0, bands % 2 ? -1 : undefined).reverse())

  append(0)
  append(0)
  for (const { name, bg, fg, trim, shift, divider } of sequence) {
    const motif = motifs[name]
    const borderHeight = divider === 1 ? 3 : 1
    const appendDivider = (row: number) =>
      append(bg, trim, (x) => {
        if (divider === 0) return x % 4 === 1
        if (divider === 1)
          return x % 8 === 3 || (row === 1 && x % 8 >= 2 && x % 8 <= 4)
        return (Math.floor(x / 2) + row) % 2 === 0
      })

    append(trim)
    append(bg)
    for (let row = 0; row < borderHeight; row++) appendDivider(row)
    append(bg)
    if (name === selected[0] && !featureRow) featureRow = rows.length
    for (let y = 0; y < motif.height; y++)
      append(bg, fg, (x) => motif.stitch((x + shift) % motif.period, y))
    append(bg)
    for (let row = borderHeight - 1; row >= 0; row--) appendDivider(row)
    append(bg)
    append(trim)
    append(0)
    append(0)
  }
  return { rows, featureRow: featureRow || 6 }
}

function shade(color: string, amount: number) {
  const channels = colorChannels(color).map((value) =>
    Math.round(
      amount < 0 ? value * (1 + amount) : value + (255 - value) * amount
    )
  )
  return `rgb(${channels.join(",")})`
}

function yarnPattern(color: string, index: number) {
  const stitch =
    "M.16 .16C.18 .45 .37 .69 .49 .84M.84 .16C.82 .45 .63 .69 .51 .84"
  return `<linearGradient id="y${index}" x2="1" y2=".2"><stop stop-color="${shade(color, 0.17)}"/><stop offset=".45" stop-color="${color}"/><stop offset="1" stop-color="${shade(color, -0.19)}"/></linearGradient>
<pattern id="p${index}" width="1" height="1" patternUnits="userSpaceOnUse">
<path fill="${shade(color, -0.27)}" d="M0 0h1v1H0z"/>
<g fill="none" stroke-linecap="round">
<path d="${stitch}" stroke="${shade(color, -0.47)}" stroke-width=".33" transform="translate(0 .024)"/>
<path d="${stitch}" stroke="url(#y${index})" stroke-width=".285"/>
<path d="${stitch}" stroke="${shade(color, 0.25)}" stroke-width=".045" opacity=".58" transform="translate(-.035 -.01)"/>
</g></pattern>`
}

export type FairIsleTexture = ReturnType<typeof createFairIsleTexture>

export function createFairIsleTexture(
  settings: TextureOptions = defaultFairIsleSettings,
  rowRatio = FAIR_ISLE_ROW_RATIO
) {
  const { colors, mode } = settings
  const { rows, featureRow } = createStitchChart(settings)
  // Join adjacent stitches of the same color into one path segment.
  const paths = colors.map(() => "")
  rows.forEach((row, y) => {
    for (let x = 0; x < columns;) {
      const color = row[x]
      let end = x + 1
      while (row[end] === color) end++
      const width = end - x
      paths[color] += `M${x} ${y}h${width}v1H${x}z`
      x = end
    }
  })
  const defs = mode === "knit" ? colors.map(yarnPattern).join("") : ""
  const stitches = paths.map((path, index) => {
    const fill = mode === "knit" ? `url(#p${index})` : colors[index]
    return `<path fill="${fill}" d="${path}"/>`
  })
  const grid =
    mode === "chart"
      ? `<pattern id="grid" width="1" height="1" patternUnits="userSpaceOnUse"><path d="M0 1V0H1" fill="none" stroke="#000" stroke-opacity=".32" stroke-width=".11"/></pattern>`
      : ""
  const gridOverlay = grid
    ? `<rect width="${columns}" height="${rows.length}" fill="url(#grid)"/>`
    : ""
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${columns} ${rows.length * rowRatio}" preserveAspectRatio="none">`,
    `<defs>${defs}${grid}</defs><g transform="scale(1 ${rowRatio})">`,
    `<g shape-rendering="crispEdges">${stitches.join("")}</g>${gridOverlay}</g></svg>`,
  ].join("")
  return {
    backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(svg)}")`,
    svg,
    columns,
    rows: rows.length,
    featureRow,
  }
}

export function fairIsleTileGeometry(
  texture: FairIsleTexture,
  stitchSize: number
) {
  const rowHeight = stitchSize * FAIR_ISLE_ROW_RATIO
  return {
    width: texture.columns * stitchSize,
    height: texture.rows * rowHeight,
    top: (2 - texture.featureRow) * rowHeight,
  }
}
