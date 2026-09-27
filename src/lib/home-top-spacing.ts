export const traditionalTopSpacingPresets = {
  near: { matrixTopPadding: 24, emptySearchGap: 0 },
  middle: { matrixTopPadding: 48, emptySearchGap: 12 },
  far: { matrixTopPadding: 80, emptySearchGap: 24 },
} as const

export type TraditionalTopSpacing = keyof typeof traditionalTopSpacingPresets
export const defaultTraditionalTopSpacing: TraditionalTopSpacing = "far"

export function isTraditionalTopSpacing(
  value: unknown
): value is TraditionalTopSpacing {
  return (
    typeof value === "string" &&
    Object.hasOwn(traditionalTopSpacingPresets, value)
  )
}

export function traditionalTopInsets(
  spacing: TraditionalTopSpacing,
  hasMatrix: boolean
) {
  const preset = traditionalTopSpacingPresets[spacing]
  return hasMatrix
    ? { topPadding: preset.matrixTopPadding, searchGap: 24 }
    : { topPadding: 24, searchGap: preset.emptySearchGap }
}
