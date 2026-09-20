import type { ButtonAction } from "./types"

export const buttonActionLabelKeys = {
  "toggle-theme": "toggleTheme",
  "tidy-grid": "tidyGrid",
  "toggle-selection": "toggleSelection",
  "open-settings": "openSettings",
  "open-components": "openComponents",
} as const satisfies Record<ButtonAction, string>

export const buttonActions = Object.keys(
  buttonActionLabelKeys
) as ButtonAction[]
