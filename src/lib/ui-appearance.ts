export const uiRadiusOptions = ["none", "small", "medium", "large"] as const
export const uiDepthOptions = ["none", "subtle", "medium", "strong"] as const

export type UiRadius = (typeof uiRadiusOptions)[number]
export type UiDepth = (typeof uiDepthOptions)[number]

export const defaultUiAppearance = "medium"
