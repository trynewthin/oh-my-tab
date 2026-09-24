import type { UtilityWidgetItem } from "./utility-types"

export type TabEntry = {
  id: string
  name: string
  url: string
  size?: "small" | "medium"
  color?: string
  dynamicEffect?: boolean
  // Pins a fixed icon (e.g. preview samples); without it the favicon of
  // `url` is resolved through the favicon cache.
  icon?: string
}

export type TabItem = TabEntry & {
  kind: "tab"
  size: "small" | "medium"
  color: string
}

export type FolderItem = {
  id: string
  kind: "folder"
  name: string
  size: "small" | "large" | "tall" | "wide" | "wide-tall"
  color: string
  tabs: TabEntry[]
  dynamicEffect?: boolean
}

export type DotCanvasItem = {
  id: string
  pixelColumns?: number
  kind: "dot-canvas"
  name: string
  size: "large" | "tall" | "wide" | "wide-tall"
  color: string
  pixels: string[]
  dynamicEffect?: boolean
}

export type GardenPlant = {
  slot: number
  plantedAt: number
  species: "flowers" | "ferns"
  seed?: number
  appearanceVersion?: 2
  name?: string
  boost?: number
  rewardedLevel?: number
}
export type EcosystemItem = {
  id: string
  kind: "ecosystem"
  name: string
  size: "large"
  color: string
  species: "flowers" | "ferns"
  plants: GardenPlant[]
  album?: GardenPlant[]
  points?: number
  pointsUpdatedAt?: number
  lastCheckIn?: string
  dynamicEffect?: boolean
}

export type CalendarItem = {
  id: string
  kind: "calendar"
  name: string
  size: "large" | "small" | "medium"
  color: string
  dynamicEffect?: boolean
}
export type TodoTask = { id: string; text: string; done: boolean }
export type TodoItem = {
  id: string
  kind: "todo"
  name: string
  size: "small" | "medium" | "large"
  color: string
  tasks: TodoTask[]
  dynamicEffect?: boolean
}

export type MinimalSearchItem = {
  id: string
  kind: "search-minimal"
  name: string
  size: "compact" | "medium" | "small"
  color: string
  dynamicEffect?: boolean
}

export type FullSearchItem = {
  id: string
  kind: "search-full"
  name: string
  size: "medium"
  color: string
  dynamicEffect?: boolean
}

export type TemplateItem = {
  id: string
  kind: "template"
  name: string
  size: "small" | "medium" | "wide" | "large"
  color: string
  dynamicEffect?: boolean
}

export type ButtonAction =
  | "toggle-theme"
  | "tidy-grid"
  | "toggle-selection"
  | "open-settings"
  | "open-components"

export type ButtonItem = {
  id: string
  kind: "button"
  name: string
  size: "small"
  color: string
  action: ButtonAction
  dynamicEffect?: boolean
}

export type GridItem =
  | TabItem
  | FolderItem
  | DotCanvasItem
  | EcosystemItem
  | CalendarItem
  | TodoItem
  | MinimalSearchItem
  | FullSearchItem
  | TemplateItem
  | ButtonItem
  | UtilityWidgetItem

export function normalizeTabUrl(value: string): string | null {
  try {
    const raw = value.trim()
    if (!raw) return null
    const url = new URL(
      /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`
    )
    return ["http:", "https:"].includes(url.protocol) ? url.href : null
  } catch {
    return null
  }
}
