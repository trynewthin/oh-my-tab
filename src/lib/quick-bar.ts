import { buttonActions } from "@/lib/grid/button-actions"
import { normalizeTabUrl, type ButtonAction } from "@/lib/grid/types"

export type QuickBarSide = "left" | "right"
export type QuickBarControl =
  | { id: string; kind: "system"; action: ButtonAction }
  | { id: string; kind: "site"; name: string; url: string }
export type QuickBarCenter =
  { kind: "none" } | { kind: "time" } | { kind: "text"; text: string }
export type QuickBarConfig = {
  left: QuickBarControl[]
  center: QuickBarCenter
  right: QuickBarControl[]
}

export const emptyQuickBar = (): QuickBarConfig => ({
  left: [],
  center: { kind: "none" },
  right: [],
})

export const defaultQuickBar = (): QuickBarConfig => ({
  left: [
    { id: "default-components", kind: "system", action: "open-components" },
  ],
  center: { kind: "time" },
  right: [{ id: "default-settings", kind: "system", action: "open-settings" }],
})

export const MAX_QUICK_CONTROLS_PER_SIDE = 24
const MAX_TEXT_LENGTH = 80

export function validQuickBarControl(value: unknown): value is QuickBarControl {
  if (!value || typeof value !== "object") return false
  const control = value as Partial<QuickBarControl>
  if (typeof control.id !== "string" || !control.id || control.id.length > 100)
    return false
  if (control.kind === "system")
    return buttonActions.includes(control.action as ButtonAction)
  if (control.kind === "site")
    return (
      typeof control.name === "string" &&
      control.name.trim().length > 0 &&
      control.name.length <= MAX_TEXT_LENGTH &&
      typeof control.url === "string" &&
      /^https?:\/\//i.test(control.url) &&
      normalizeTabUrl(control.url) !== null
    )
  return false
}

export function validQuickBarCenter(value: unknown): value is QuickBarCenter {
  if (!value || typeof value !== "object") return false
  const center = value as Partial<QuickBarCenter>
  return (
    center.kind === "none" ||
    center.kind === "time" ||
    (center.kind === "text" &&
      typeof center.text === "string" &&
      center.text.length <= MAX_TEXT_LENGTH)
  )
}

export function validQuickBarConfig(value: unknown): value is QuickBarConfig {
  if (!value || typeof value !== "object") return false
  const config = value as Partial<QuickBarConfig>
  if (
    !Array.isArray(config.left) ||
    !Array.isArray(config.right) ||
    config.left.length > MAX_QUICK_CONTROLS_PER_SIDE ||
    config.right.length > MAX_QUICK_CONTROLS_PER_SIDE ||
    !config.left.every(validQuickBarControl) ||
    !config.right.every(validQuickBarControl) ||
    !validQuickBarCenter(config.center)
  )
    return false
  const ids = [...config.left, ...config.right].map((control) => control.id)
  return new Set(ids).size === ids.length
}

export function sanitizeQuickBarConfig(value: unknown): QuickBarConfig {
  if (!value || typeof value !== "object") return emptyQuickBar()
  const saved = value as Partial<QuickBarConfig>
  const ids = new Set<string>()
  const side = (value: unknown): QuickBarControl[] => {
    if (!Array.isArray(value)) return []
    return value
      .filter((control): control is QuickBarControl => {
        if (!validQuickBarControl(control) || ids.has(control.id)) return false
        ids.add(control.id)
        return true
      })
      .slice(0, MAX_QUICK_CONTROLS_PER_SIDE)
  }
  return {
    left: side(saved.left),
    center: validQuickBarCenter(saved.center) ? saved.center : { kind: "none" },
    right: side(saved.right),
  }
}

export function normalizeQuickSite(name: string, url: string) {
  const normalized = normalizeTabUrl(url)
  const trimmed = name.trim()
  if (!normalized || !trimmed || trimmed.length > MAX_TEXT_LENGTH) return null
  return { name: trimmed, url: normalized }
}

export function placeQuickControl(
  config: QuickBarConfig,
  id: string,
  side: QuickBarSide,
  index: number
): QuickBarConfig {
  const source: QuickBarSide | null = config.left.some(
    (control) => control.id === id
  )
    ? "left"
    : config.right.some((control) => control.id === id)
      ? "right"
      : null
  if (
    !source ||
    (source !== side && config[side].length >= MAX_QUICK_CONTROLS_PER_SIDE)
  )
    return config
  const sourceIndex = config[source].findIndex((control) => control.id === id)
  const sourceControls = config[source].filter((control) => control.id !== id)
  const destination = source === side ? sourceControls : [...config[side]]
  const target = Math.max(
    0,
    Math.min(
      destination.length,
      Math.round(index) - (source === side && sourceIndex < index ? 1 : 0)
    )
  )
  destination.splice(target, 0, config[source][sourceIndex])
  if (source === side) return { ...config, [side]: destination }
  return { ...config, [source]: sourceControls, [side]: destination }
}
