import { isSystemActionId, type SystemActionId } from "@/lib/system-actions"

export type SearchShortcutControl = { id: string; action: SystemActionId }
export type SearchShortcutConfig = {
  controls: SearchShortcutControl[]
  collapseBefore: number
}

export const MAX_SEARCH_SHORTCUTS = 16

const defaultActions: readonly SystemActionId[] = [
  "toggle-theme",
  "add-tab",
  "add-folder",
  "open-components",
  "tidy-grid",
  "toggle-selection",
  "open-settings",
]

export function defaultSearchShortcuts(): SearchShortcutConfig {
  return {
    controls: defaultActions.map((action) => ({
      id: `default-${action}`,
      action,
    })),
    collapseBefore: defaultActions.length - 1,
  }
}

export function searchShortcutGroups(config: SearchShortcutConfig) {
  return {
    hidden: config.controls.slice(0, config.collapseBefore),
    visible: config.controls.slice(config.collapseBefore),
  }
}

function validControl(value: unknown): value is SearchShortcutControl {
  if (!value || typeof value !== "object") return false
  const control = value as Partial<SearchShortcutControl>
  return (
    typeof control.id === "string" &&
    control.id.length > 0 &&
    control.id.length <= 100 &&
    isSystemActionId(control.action)
  )
}

export function validSearchShortcuts(
  value: unknown
): value is SearchShortcutConfig {
  if (!value || typeof value !== "object") return false
  const config = value as Partial<SearchShortcutConfig>
  const boundary = config.collapseBefore
  if (
    !Array.isArray(config.controls) ||
    config.controls.length > MAX_SEARCH_SHORTCUTS ||
    !config.controls.every(validControl) ||
    typeof boundary !== "number" ||
    !Number.isInteger(boundary) ||
    boundary < 0 ||
    boundary > config.controls.length
  )
    return false
  return (
    new Set(config.controls.map((control) => control.id)).size ===
    config.controls.length
  )
}

export function sanitizeSearchShortcuts(value: unknown): SearchShortcutConfig {
  if (!value || typeof value !== "object") return defaultSearchShortcuts()
  const saved = value as Partial<SearchShortcutConfig>
  if (!Array.isArray(saved.controls)) return defaultSearchShortcuts()
  const boundary = saved.collapseBefore
  const rawIndex =
    typeof boundary === "number" && Number.isInteger(boundary)
      ? Math.max(0, Math.min(saved.controls.length, boundary))
      : saved.controls.length
  const controls: SearchShortcutControl[] = []
  const ids = new Set<string>()
  let collapseBefore = 0
  for (const [index, control] of saved.controls.entries()) {
    if (
      !validControl(control) ||
      ids.has(control.id) ||
      controls.length >= MAX_SEARCH_SHORTCUTS
    )
      continue
    ids.add(control.id)
    controls.push(control)
    if (index < rawIndex) collapseBefore++
  }
  return { controls, collapseBefore }
}

export function appendSearchShortcut(
  config: SearchShortcutConfig,
  control: SearchShortcutControl
): SearchShortcutConfig {
  if (
    config.controls.length >= MAX_SEARCH_SHORTCUTS ||
    !validControl(control) ||
    config.controls.some((entry) => entry.id === control.id)
  )
    return config
  return { ...config, controls: [...config.controls, control] }
}

export function removeSearchShortcut(
  config: SearchShortcutConfig,
  id: string
): SearchShortcutConfig {
  const index = config.controls.findIndex((control) => control.id === id)
  if (index < 0) return config
  return {
    controls: config.controls.filter((control) => control.id !== id),
    collapseBefore:
      config.collapseBefore - (index < config.collapseBefore ? 1 : 0),
  }
}

export function moveSearchShortcut(
  config: SearchShortcutConfig,
  id: string,
  index: number
): SearchShortcutConfig {
  if (!Number.isFinite(index)) return config
  const current = config.controls.find((control) => control.id === id)
  if (!current) return config
  const controls = config.controls.filter((control) => control.id !== id)
  const target = Math.max(0, Math.min(controls.length, Math.round(index)))
  if (target === config.controls.indexOf(current)) return config
  controls.splice(target, 0, current)
  return { ...config, controls }
}

export function setSearchShortcutBoundary(
  config: SearchShortcutConfig,
  index: number
): SearchShortcutConfig {
  if (!Number.isFinite(index)) return config
  const collapseBefore = Math.max(
    0,
    Math.min(config.controls.length, Math.round(index))
  )
  if (collapseBefore === config.collapseBefore) return config
  return {
    ...config,
    collapseBefore,
  }
}
