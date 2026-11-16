import { FAIR_ISLE_PALETTES, type FairIslePaletteId } from "@/lib/fair-isle"

// 4px solid cells with no gap: the knit reads as one continuous fabric.
export const FAIR_ISLE_CELL_SIZE = 4
export const FAIR_ISLE_GAP = 0

// Micro V-stitch relief drawn over the cell grid so the surface reads as
// knitted fabric rather than flat color blocks.
export const FAIR_ISLE_STITCH_IMAGE = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Cpath d='M0.5 1 L2 3 L3.5 1' stroke='rgba(0,0,0,0.16)' stroke-width='0.7' fill='none'/%3E%3C/svg%3E")`

type Yarn = "bg" | "fg" | "accent"

type IsleBand = {
  start: number
  h: number
  yarn: Yarn
  hit: (lx: number, ly: number) => boolean
}

type Isle = { bands: IsleBand[]; total: number }

function mulberry32(a: number) {
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

type Random = () => number
type BandKind = (r: Random) => { h: number; hit: IsleBand["hit"] }

// Motif families from the standard Fair Isle vocabulary — every pattern is a
// parametric formula, never a fixed bitmap.
const KINDS: BandKind[] = [
  // chevron / zigzag chain
  (r) => {
    const amp = 3 + Math.floor(r() * 4)
    const h = 2 * amp + 1
    const period = 2 * amp
    return {
      h,
      hit: (lx, ly) => {
        const t = Math.abs((lx % period) - amp)
        return ly === amp - t || ly === amp + t
      },
    }
  },
  // diamond outline
  (r) => {
    const amp = 3 + Math.floor(r() * 3)
    const h = 2 * amp + 1
    const half = 4 + Math.floor(r() * 3)
    const period = half * 2
    return {
      h,
      hit: (lx, ly) => {
        const dx = Math.abs((lx % period) - half)
        const edge = amp - (dx * amp) / half
        return Math.abs(ly - edge) < 0.9 || Math.abs(ly - (h - 1 - edge)) < 0.9
      },
    }
  },
  // peerie lattice (offset dots / mini X's)
  (r) => {
    const s = 3 + Math.floor(r() * 3)
    const h = s * 2
    return {
      h,
      hit: (lx, ly) => lx % s === ly % s || (lx % s) + (ly % s) === s,
    }
  },
  // corrugated rib / checker
  (r) => {
    const h = 2 + Math.floor(r() * 2) * 2
    const alt = r() < 0.5
    return {
      h,
      hit: (lx, ly) => (alt ? (lx + ly) % 2 === 0 : lx % 2 === 0),
    }
  },
  // tree / antler stacks (double chevron)
  (r) => {
    const amp = 3 + Math.floor(r() * 3)
    const h = 2 * amp + 2
    const period = 2 * amp + 2
    return {
      h,
      hit: (lx, ly) => {
        const t = Math.abs((lx % period) - amp)
        return (
          ly === t || ly === h - 1 - t || (ly === h - 1 && lx % period === amp)
        )
      },
    }
  },
  // twin rules + dashed center
  (r) => {
    const h = 4 + Math.floor(r() * 3)
    const mid = Math.floor(h / 2)
    const dash = 2 + Math.floor(r() * 3)
    return {
      h,
      hit: (lx, ly) =>
        ly === 0 || ly === h - 1 || (ly === mid && lx % (dash * 2) < dash),
    }
  },
]

// One seed generates a whole pattern sheet: band order, sizes, spacing and
// yarn assignment are all drawn from the seeded stream.
export function makeIsle(seed: number): Isle {
  const r = mulberry32(seed)
  const bands: IsleBand[] = []
  let y = 0
  const count = 5 + Math.floor(r() * 4)
  for (let i = 0; i < count; i++) {
    const band = KINDS[Math.floor(r() * KINDS.length)](r)
    const yarn: Yarn = r() < 0.28 ? "accent" : "fg"
    bands.push({ start: y, h: band.h, yarn, hit: band.hit })
    y += band.h
    if (i < count - 1) {
      const gap = 1 + Math.floor(r() * 2)
      bands.push({ start: y, h: gap, yarn: "bg", hit: () => false })
      y += gap
    }
  }
  return { bands, total: y }
}

export function fairIsleYarns(
  color: string,
  palette: FairIslePaletteId
): Record<Yarn, string> {
  if (palette !== "auto") return FAIR_ISLE_PALETTES[palette]
  // Derived from the tab color: faint base, solid motif yarn, deepened accent.
  return {
    bg: `color-mix(in srgb, ${color} 14%, transparent)`,
    fg: `color-mix(in srgb, ${color} 75%, transparent)`,
    accent: `color-mix(in srgb, ${color} 55%, #171a21)`,
  }
}

export function createFairIsleTexture(
  color: string,
  seed: number,
  palette: FairIslePaletteId
) {
  const isle = makeIsle(seed)
  const yarns = fairIsleYarns(color, palette)
  return (x: number, y: number, _time?: number, visibility = 1) => {
    const idx = ((y % isle.total) + isle.total) % isle.total
    const band = isle.bands.find(
      (b) => idx >= b.start && idx < b.start + b.h
    ) as IsleBand
    const yarn = band.hit(x, idx - band.start) ? band.yarn : "bg"
    const value = yarns[yarn]
    return visibility >= 1
      ? value
      : `color-mix(in srgb, ${value} ${Math.round(visibility * 100)}%, transparent)`
  }
}
