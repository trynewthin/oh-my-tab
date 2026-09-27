import {
  Checks,
  CircleHalf,
  BookmarkSimple,
  FolderPlus,
  Plus,
  Gear,
  GridFour,
  SquaresFour,
  type Icon,
} from "@phosphor-icons/react"
import type { SystemActionId } from "@/lib/system-actions"

export const systemActionIcons = {
  "toggle-theme": CircleHalf,
  "add-tab": BookmarkSimple,
  "add-folder": FolderPlus,
  "tidy-grid": GridFour,
  "toggle-selection": Checks,
  "open-settings": Gear,
  "open-components": SquaresFour,
} as const satisfies Record<SystemActionId, Icon>

export const systemActionMenuIcons = {
  ...systemActionIcons,
  "open-components": Plus,
} as const satisfies Record<SystemActionId, Icon>
