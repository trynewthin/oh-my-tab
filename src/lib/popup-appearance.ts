import { z } from "zod"

export const popupEffects = ["inherit", "none", "burning", "particles"] as const
export const popupSizeLimits = {
  width: { min: 280, max: 560 },
  padding: { min: 12, max: 32 },
} as const

export const popupAppearanceSchema = z.object({
  width: z
    .number()
    .int()
    .min(popupSizeLimits.width.min)
    .max(popupSizeLimits.width.max),
  padding: z
    .number()
    .int()
    .min(popupSizeLimits.padding.min)
    .max(popupSizeLimits.padding.max),
  effect: z.enum(popupEffects),
  color: z
    .string()
    .regex(/^#[0-9a-f]{6}$/i)
    .nullable(),
  animated: z.boolean(),
})

export type PopupAppearance = z.infer<typeof popupAppearanceSchema>

export const defaultPopupAppearance: Readonly<PopupAppearance> = {
  width: 360,
  padding: 20,
  effect: "inherit",
  color: null,
  animated: true,
}
