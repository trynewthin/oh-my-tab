import { z } from "zod"

export const fairIsleMotifs = [
  "star",
  "snowflake",
  "diamond",
  "cross",
  "zigzag",
  "tree",
  "heart",
  "flower",
  "deer",
  "checker",
] as const
export type FairIsleMotif = (typeof fairIsleMotifs)[number]

export const fairIslePatterns = {
  classic: ["star", "diamond", "cross", "zigzag"],
  snow: ["snowflake", "star", "cross"],
  diamond: ["diamond", "zigzag", "checker", "cross"],
  cabin: ["tree", "deer", "snowflake", "diamond"],
  folk: ["flower", "heart", "star", "diamond"],
  mix: [
    "star",
    "snowflake",
    "diamond",
    "tree",
    "heart",
    "flower",
    "deer",
    "zigzag",
    "cross",
    "checker",
  ],
} as const satisfies Record<string, readonly FairIsleMotif[]>

export const fairIslePalettes = {
  woodland: ["#293F3D", "#EFE4CE", "#B65B46", "#D7A365", "#879581", "#684F45"],
  berry: ["#7B303D", "#F4E7CF", "#B75456", "#C4A27A", "#3D534A", "#D1B7AD"],
  ocean: ["#263A56", "#F0EDDD", "#6593A1", "#C49269", "#91ACAF", "#A94C40"],
  oat: ["#504238", "#F0E5CC", "#B58555", "#C8B594", "#738074", "#8F5747"],
  rose: ["#47364E", "#EADDDD", "#B77887", "#CCA774", "#8A9A87", "#754F70"],
  nordic: ["#A33735", "#F2E8D7", "#324A46", "#D0A16D", "#647C70"],
  pastel: ["#EEE6D4", "#657A79", "#D994A1", "#B2C4A0", "#ABACCF", "#D9AF72"],
  candy: [
    "#32325E",
    "#F5EACB",
    "#DE6986",
    "#E4B64B",
    "#66AF9C",
    "#8F80C3",
    "#D67A4F",
  ],
  mono: ["#303632", "#E9E7DC", "#848D80", "#BABDAA"],
} as const

export type FairIslePattern = keyof typeof fairIslePatterns
export type FairIslePalette = keyof typeof fairIslePalettes
export const fairIslePatternIds = Object.keys(
  fairIslePatterns
) as FairIslePattern[]
export const fairIslePaletteIds = Object.keys(
  fairIslePalettes
) as FairIslePalette[]
export const fairIsleModes = ["knit", "flat", "chart"] as const
export const MIN_FAIR_ISLE_STITCH_SIZE = 2
export const MAX_FAIR_ISLE_STITCH_SIZE = 18
export const MIN_FAIR_ISLE_YARNS = 3
export const MAX_FAIR_ISLE_YARNS = 8

export const fairIsleSettingsSchema = z.object({
  pattern: z.enum(fairIslePatternIds).or(z.literal("custom")),
  motifs: z
    .array(z.enum(fairIsleMotifs))
    .min(1)
    .max(fairIsleMotifs.length)
    .refine((values) => new Set(values).size === values.length),
  palette: z.enum(fairIslePaletteIds).or(z.enum(["custom", "random"])),
  colors: z
    .array(z.string().regex(/^#[0-9a-f]{6}$/i))
    .min(MIN_FAIR_ISLE_YARNS)
    .max(MAX_FAIR_ISLE_YARNS),
  stitchSize: z
    .number()
    .min(MIN_FAIR_ISLE_STITCH_SIZE)
    .max(MAX_FAIR_ISLE_STITCH_SIZE),
  bands: z.number().int().min(3).max(8),
  symmetry: z.boolean(),
  seed: z.string().trim().min(1).max(32),
  mode: z.enum(fairIsleModes),
})

export type FairIsleSettings = z.output<typeof fairIsleSettingsSchema>
export const defaultFairIsleSettings: FairIsleSettings = {
  pattern: "classic",
  motifs: [...fairIslePatterns.classic],
  palette: "woodland",
  colors: [...fairIslePalettes.woodland],
  stitchSize: 8,
  bands: 5,
  symmetry: false,
  seed: "FI-2026",
  mode: "knit",
}

export function sanitizeFairIsleSettings(input: unknown): FairIsleSettings {
  const result = fairIsleSettingsSchema.safeParse(input)
  return result.success ? result.data : defaultFairIsleSettings
}
