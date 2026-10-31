import type { SystemActionId } from "@/lib/system-actions"
import type { UtilityWidgetItem } from "./utility-types"

export type SquareTabSize = "square-small" | "square-medium" | "square-large"
export type TabSize = "small" | "medium" | SquareTabSize

export function isSquareTabSize(size: unknown): size is SquareTabSize {
  return (
    size === "square-small" ||
    size === "square-medium" ||
    size === "square-large"
  )
}

export type TabEntry = {
  id: string
  name: string
  url: string
  size?: TabSize
  color?: string
  dynamicEffect?: boolean
  // Pinned icon (e.g. preview samples); otherwise the favicon of `url` is used.
  icon?: string
}

export type TabItem = TabEntry & {
  kind: "tab"
  size: TabSize
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
  pixelColumns: number
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
  seed: number
  appearance: "classic" | "varied"
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

export type TemplateItem = {
  id: string
  kind: "template"
  name: string
  size: "small" | "medium" | "wide" | "large"
  color: string
  dynamicEffect?: boolean
}

export type ButtonItem = {
  id: string
  kind: "button"
  name: string
  size: "small"
  color: string
  action: SystemActionId
  dynamicEffect?: boolean
}

type ButtonSlotOrigin = { color: string; dynamicEffect?: boolean }
export type ButtonSlotControl =
  | {
      id: string
      kind: "system"
      action: SystemActionId
      origin?: ButtonSlotOrigin & { name: string }
    }
  | {
      id: string
      kind: "site"
      name: string
      url: string
      icon?: string
      origin?: ButtonSlotOrigin & { size: TabSize }
    }

export type ButtonSlotItem = {
  id: string
  kind: "button-slot"
  name: string
  size: "wide" | "small" | "medium"
  color: string
  controls: ButtonSlotControl[]
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
  | TemplateItem
  | ButtonItem
  | ButtonSlotItem
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
