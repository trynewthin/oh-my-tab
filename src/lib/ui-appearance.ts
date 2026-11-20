import { z } from "zod"
import { fairIsleSettingsSchema } from "@/lib/fair-isle-settings"
import { liquidGlassSchema } from "@/lib/liquid-glass"
import {
  materialStyles,
  supportsMaterial,
  type MaterialPlacement,
  type MaterialStyle,
} from "@/lib/material"
import { MAX_STAR_TRAIL_SPEED, MIN_STAR_TRAIL_SPEED } from "@/lib/star-trails"

export const uiRadiusOptions = ["none", "small", "medium", "large"] as const
export const uiDepthOptions = ["none", "subtle", "medium", "strong"] as const

export type UiRadius = (typeof uiRadiusOptions)[number]
export type UiDepth = (typeof uiDepthOptions)[number]

export const defaultUiAppearance = "medium"

export const uiAppearanceOverridesSchema = z.object({
  radius: z.enum(uiRadiusOptions).optional(),
  border: z.enum(uiDepthOptions).optional(),
  shadow: z.enum(uiDepthOptions).optional(),
})

export type UiAppearanceOverrides = z.infer<typeof uiAppearanceOverridesSchema>

export const settingsMaterialPlacements = {
  backgroundMaterial: "background",
  sidebarMaterial: "card",
  controlMaterial: "control",
} as const satisfies Record<string, MaterialPlacement>

function materialFor(placement: MaterialPlacement) {
  return z
    .enum(materialStyles)
    .refine((style) => supportsMaterial(style, placement))
    .optional()
}

export const backgroundMaskLimits = { strength: 100, blur: 32 } as const

const backgroundMaskSchema = z.object({
  strength: z.number().int().min(0).max(backgroundMaskLimits.strength),
  blur: z.number().int().min(0).max(backgroundMaskLimits.blur),
})

export type SettingsBackgroundMask = z.infer<typeof backgroundMaskSchema>

export function resolveSettingsBackgroundMask(
  material: MaterialStyle,
  mask?: SettingsBackgroundMask
): SettingsBackgroundMask {
  return mask ?? { strength: material === "fair-isle" ? 60 : 0, blur: 0 }
}

export const materialAmplitudeMax = 2

const materialAmplitudeSchema = z.number().min(0).max(materialAmplitudeMax)
const settingsMaterialParametersSchema = z.object({
  burning: materialAmplitudeSchema.optional(),
  particles: materialAmplitudeSchema.optional(),
  "star-trails": z
    .object({
      speed: z.number().min(MIN_STAR_TRAIL_SPEED).max(MAX_STAR_TRAIL_SPEED),
      mode: z.enum(["dynamic", "static"]),
    })
    .optional(),
  "fair-isle": fairIsleSettingsSchema.optional(),
  "liquid-glass": liquidGlassSchema.optional(),
})

export type SettingsMaterialParameters = z.infer<
  typeof settingsMaterialParametersSchema
>

export const settingsAppearanceSchema = uiAppearanceOverridesSchema.extend({
  backgroundMaterial: materialFor(
    settingsMaterialPlacements.backgroundMaterial
  ),
  backgroundMask: backgroundMaskSchema.optional(),
  sidebarMaterial: materialFor(settingsMaterialPlacements.sidebarMaterial),
  controlMaterial: materialFor(settingsMaterialPlacements.controlMaterial),
  materialParameters: z
    .object({
      background: settingsMaterialParametersSchema.optional(),
      sidebar: settingsMaterialParametersSchema.optional(),
      control: settingsMaterialParametersSchema.optional(),
    })
    .optional(),
})

export type SettingsAppearance = z.infer<typeof settingsAppearanceSchema>
export type SettingsMaterialSlot = keyof NonNullable<
  SettingsAppearance["materialParameters"]
>

export function uiAppearanceAttributes(appearance?: UiAppearanceOverrides) {
  return {
    "data-ui-radius": appearance?.radius,
    "data-ui-border": appearance?.border,
    "data-ui-shadow": appearance?.shadow,
  }
}
