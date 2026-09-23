import {
  Checks,
  CircleHalf,
  Gear,
  GridFour,
  SquaresFour,
  type Icon,
} from "@phosphor-icons/react"
import type { ButtonAction } from "@/lib/grid/types"

export const systemActionIcons = {
  "toggle-theme": CircleHalf,
  "tidy-grid": GridFour,
  "toggle-selection": Checks,
  "open-settings": Gear,
  "open-components": SquaresFour,
} as const satisfies Record<ButtonAction, Icon>
