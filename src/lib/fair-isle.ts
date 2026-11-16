export type FairIslePaletteId = "auto" | "navy" | "wine" | "moss" | "night"

export const FAIR_ISLE_PALETTE_IDS: readonly FairIslePaletteId[] = [
  "auto",
  "navy",
  "wine",
  "moss",
  "night",
]

export const FAIR_ISLE_PALETTES: Record<
  Exclude<FairIslePaletteId, "auto">,
  { bg: string; fg: string; accent: string }
> = {
  navy: { bg: "#f0e7d3", fg: "#2f3d63", accent: "#b0453e" },
  wine: { bg: "#e9dfca", fg: "#7c2f3b", accent: "#2e4638" },
  moss: { bg: "#e4ddc9", fg: "#40543f", accent: "#a8803f" },
  night: { bg: "#242a36", fg: "#9db1d4", accent: "#d9c9a0" },
}

export function isFairIslePaletteId(
  value: unknown
): value is FairIslePaletteId {
  return (
    typeof value === "string" &&
    (FAIR_ISLE_PALETTE_IDS as readonly string[]).includes(value)
  )
}
