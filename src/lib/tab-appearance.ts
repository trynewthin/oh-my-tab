export type TabAppearance = {
  direction: "left" | "right" | "top" | "bottom"
  display: "both" | "icon" | "text"
  justify: "start" | "center" | "end" | "between"
  align: "start" | "center" | "end"
  paddingX: number
  paddingY: number
  gap: number
  borderStyle: "none" | "solid" | "dashed" | "dotted"
  borderWidth: number
  borderColor: "theme" | string
  borderOpacity: number
  radius: number
  backgroundMode: "default" | "transparent" | "solid" | "gradient"
  backgroundColor: "item" | string
  backgroundEndColor: string
  backgroundOpacity: number
  gradientAngle: number
  backgroundBlur: number
  fontFamily: "system" | "sans" | "serif" | "mono"
  fontSize: number
  fontWeight: 400 | 500 | 600 | 700
  textColor: "theme" | string
  textOpacity: number
  textAlign: "left" | "center" | "right"
  lineHeight: number
  letterSpacing: number
  maxLines: 1 | 2 | 3 | 4
  textOverflow: "ellipsis" | "clip"
  iconScale: number
  iconOpacity: number
  iconRadius: number
  iconFit: "contain" | "cover"
}

type NumberRule = {
  kind: "number"
  min: number
  max: number
  integer?: boolean
  fallback: number
}

type EnumRule = {
  kind: "enum"
  values: readonly (string | number)[]
  fallback: string | number
}

type ColorRule = {
  kind: "color"
  fixed: readonly string[]
  fallback: string
}

type Rule = NumberRule | EnumRule | ColorRule

const HEX_COLOR = /^#[0-9a-f]{6}$/i
// Legacy version 3 stored an absolute icon size. The shared contract maps it
// to a percentage of the standard small-tab icon base (28px).
const LEGACY_ICON_REFERENCE = 28

const RULES = {
  direction: {
    kind: "enum",
    values: ["left", "right", "top", "bottom"],
    fallback: "right",
  },
  display: { kind: "enum", values: ["both", "icon", "text"], fallback: "both" },
  justify: {
    kind: "enum",
    values: ["start", "center", "end", "between"],
    fallback: "between",
  },
  align: {
    kind: "enum",
    values: ["start", "center", "end"],
    fallback: "center",
  },
  paddingX: { kind: "number", min: 0, max: 48, fallback: 16 },
  paddingY: { kind: "number", min: 0, max: 48, fallback: 8 },
  gap: { kind: "number", min: 0, max: 48, fallback: 12 },
  borderStyle: {
    kind: "enum",
    values: ["none", "solid", "dashed", "dotted"],
    fallback: "solid",
  },
  borderWidth: { kind: "number", min: 0, max: 8, fallback: 1 },
  borderColor: { kind: "color", fixed: ["theme"], fallback: "theme" },
  borderOpacity: { kind: "number", min: 0, max: 100, fallback: 100 },
  radius: { kind: "number", min: 0, max: 48, fallback: 16 },
  backgroundMode: {
    kind: "enum",
    values: ["default", "transparent", "solid", "gradient"],
    fallback: "transparent",
  },
  backgroundColor: { kind: "color", fixed: ["item"], fallback: "item" },
  backgroundEndColor: { kind: "color", fixed: [], fallback: "#8b5cf6" },
  backgroundOpacity: { kind: "number", min: 0, max: 100, fallback: 100 },
  gradientAngle: { kind: "number", min: 0, max: 360, fallback: 135 },
  backgroundBlur: { kind: "number", min: 0, max: 24, fallback: 0 },
  fontFamily: {
    kind: "enum",
    values: ["system", "sans", "serif", "mono"],
    fallback: "system",
  },
  fontSize: { kind: "number", min: 8, max: 40, fallback: 14 },
  fontWeight: {
    kind: "enum",
    values: [400, 500, 600, 700],
    fallback: 500,
  },
  textColor: { kind: "color", fixed: ["theme"], fallback: "theme" },
  textOpacity: { kind: "number", min: 0, max: 100, fallback: 100 },
  textAlign: {
    kind: "enum",
    values: ["left", "center", "right"],
    fallback: "left",
  },
  lineHeight: { kind: "number", min: 1, max: 2, fallback: 1.4 },
  letterSpacing: { kind: "number", min: -2, max: 8, fallback: 0 },
  maxLines: { kind: "number", min: 1, max: 4, integer: true, fallback: 1 },
  textOverflow: {
    kind: "enum",
    values: ["ellipsis", "clip"],
    fallback: "ellipsis",
  },
  iconScale: { kind: "number", min: 25, max: 200, fallback: 100 },
  iconOpacity: { kind: "number", min: 0, max: 100, fallback: 90 },
  iconRadius: { kind: "number", min: 0, max: 50, fallback: 0 },
  iconFit: { kind: "enum", values: ["contain", "cover"], fallback: "contain" },
} satisfies Record<keyof TabAppearance, Rule>

export const DEFAULT_TAB_APPEARANCE: Readonly<TabAppearance> = Object.freeze(
  Object.fromEntries(
    Object.entries(RULES).map(
      ([field, rule]) => [field, rule.fallback] as const
    )
  ) as unknown as TabAppearance
)

/**
 * Normalizes persisted, imported and clamped UI values into a complete
 * appearance. Version 3 records are converted instead of being carried along
 * as inactive data: its padding becomes the horizontal/vertical padding and
 * its absolute icon size becomes a scale relative to the 28px reference base.
 */
export function sanitizeTabAppearance(value: unknown): TabAppearance {
  const source =
    value && typeof value === "object" && !Array.isArray(value)
      ? { ...(value as Record<string, unknown>) }
      : {}
  if (source.paddingX === undefined) source.paddingX = source.padding
  if (source.paddingY === undefined) source.paddingY = source.padding
  if (source.iconScale === undefined) {
    const iconSize = source.iconSize
    if (typeof iconSize === "number" && Number.isFinite(iconSize))
      source.iconScale = Math.round((iconSize / LEGACY_ICON_REFERENCE) * 100)
  }
  const appearance = {} as Record<keyof TabAppearance, string | number>
  for (const field of Object.keys(RULES) as (keyof TabAppearance)[]) {
    const rule: Rule = RULES[field]
    const raw = source[field]
    if (rule.kind === "number") {
      if (typeof raw === "number" && Number.isFinite(raw)) {
        const bounded = Math.min(rule.max, Math.max(rule.min, raw))
        appearance[field] = rule.integer ? Math.round(bounded) : bounded
      } else appearance[field] = rule.fallback
    } else if (rule.kind === "enum") {
      appearance[field] =
        (typeof raw === "string" || typeof raw === "number") &&
        rule.values.includes(raw)
          ? raw
          : rule.fallback
    } else {
      appearance[field] =
        typeof raw === "string" &&
        (rule.fixed.includes(raw) || HEX_COLOR.test(raw))
          ? raw
          : rule.fallback
    }
  }
  return appearance as unknown as TabAppearance
}

/**
 * Backup validation is stricter than hydration: every appearance field that
 * the backup actually provides must already be inside its allowed domain.
 * Missing fields stay optional and are defaulted later, while out-of-range or
 * unknown values are rejected instead of being silently clamped.
 */
export function validTabAppearance(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false
  const source = value as Record<string, unknown>
  const appearance = sanitizeTabAppearance(value)
  return (Object.keys(appearance) as (keyof TabAppearance)[]).every(
    (field) =>
      source[field] === undefined || source[field] === appearance[field]
  )
}
