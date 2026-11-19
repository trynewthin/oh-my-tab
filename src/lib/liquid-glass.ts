import { z } from "zod"

export const liquidGlassFinishes = ["clear", "frost"] as const

export const liquidGlassRanges = {
  clarity: { min: 20, max: 100, unit: "%" },
  refraction: { min: 0, max: 100, unit: "%" },
  rimWidth: { min: 10, max: 100, unit: "%" },
  blur: { min: 0, max: 32, unit: "px" },
  saturation: { min: 0, max: 200, unit: "%" },
  sheenIntensity: { min: 0, max: 100, unit: "%" },
  glintIntensity: { min: 0, max: 100, unit: "%" },
  glintSize: { min: 60, max: 320, unit: "px" },
} as const

function glassRange(key: keyof typeof liquidGlassRanges) {
  const { min, max } = liquidGlassRanges[key]
  return z.number().int().min(min).max(max)
}

export const liquidGlassSchema = z.object({
  finish: z.enum(liquidGlassFinishes),
  clarity: glassRange("clarity"),
  sheen: z.boolean(),
  tint: z
    .string()
    .regex(/^#[\da-f]{6}$/i)
    .nullable()
    .default(null),
  refraction: glassRange("refraction").nullable().default(null),
  rimWidth: glassRange("rimWidth").default(50),
  blur: glassRange("blur").nullable().default(null),
  saturation: glassRange("saturation").default(125),
  sheenIntensity: glassRange("sheenIntensity").nullable().default(null),
  pointerHighlight: z.boolean().nullable().default(null),
  glintIntensity: glassRange("glintIntensity").default(28),
  glintSize: glassRange("glintSize").default(180),
})

export type LiquidGlassSettings = z.output<typeof liquidGlassSchema>

export const defaultLiquidGlass = liquidGlassSchema.parse({
  finish: "clear",
  clarity: 68,
  sheen: true,
})

export function liquidGlassOptics(settings: LiquidGlassSettings) {
  const { finish, clarity } = settings
  const frost = finish === "frost"
  const opacity = (frost ? 0.19 : 0.075) + (100 - clarity) * 0.0039

  return {
    opacity: Number(opacity.toFixed(3)),
    tint: settings.tint ?? "#ffffff",
    refraction: settings.refraction ?? (frost ? 35 : 55),
    blur: settings.blur ?? (frost ? 14 : 10),
    sheenIntensity: settings.sheenIntensity ?? 19,
    pointerHighlight: settings.pointerHighlight ?? settings.sheen,
  }
}
