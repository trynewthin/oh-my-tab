import {
  Gear,
  House,
  Info,
  MagnifyingGlass,
  Palette,
} from "@phosphor-icons/react"
import { appEnvironment } from "@/lib/app-environment"
import {
  defaultSettingsSection,
  type SettingsSection,
} from "@/lib/settings-sections"
import config from "./settings-nav.json"

export type SettingsNavNode = {
  id: string
  labelKey: string
  icon?: string
  requires?: "toolbarPopup"
  children?: SettingsNavNode[]
}

export const settingsNav = config.nav as SettingsNavNode[]

export function availableSettingsNav(): SettingsNavNode[] {
  const hasToolbarPopup = appEnvironment.hasToolbarPopup
  function filterRoutes(nodes: SettingsNavNode[]): SettingsNavNode[] {
    return nodes.flatMap((node) => {
      if (node.requires === "toolbarPopup" && !hasToolbarPopup) return []
      if (!node.children?.length) return [node]
      const children = filterRoutes(node.children)
      return children.length ? [{ ...node, children }] : []
    })
  }
  return filterRoutes(settingsNav)
}

export function resolveSettingsSection(
  section: SettingsSection,
  navigation: SettingsNavNode[]
): SettingsSection {
  return collectSettingsRoutes(navigation).some(
    ({ route }) => route.id === section
  )
    ? section
    : defaultSettingsSection
}

export const settingsIcons = {
  gear: Gear,
  house: House,
  "magnifying-glass": MagnifyingGlass,
  palette: Palette,
  info: Info,
} as const

export type SettingsIconName = keyof typeof settingsIcons

export function settingsIcon(name?: string) {
  if (!name || !(name in settingsIcons)) return
  return settingsIcons[name as SettingsIconName]
}

export function collectSettingsRoutes(
  nodes: SettingsNavNode[] = settingsNav,
  parent?: SettingsNavNode
): { route: SettingsNavNode; parent?: SettingsNavNode }[] {
  return nodes.flatMap((node) =>
    node.children?.length
      ? collectSettingsRoutes(node.children, node)
      : [{ route: node, parent }]
  )
}

export function findSettingsRoute(section: string) {
  return collectSettingsRoutes().find(({ route }) => route.id === section)
}

export function settingsRouteSurface(section: string) {
  return findSettingsRoute(section)?.parent?.id
}

export function isSettingsRouteId(value: string) {
  return collectSettingsRoutes().some(({ route }) => route.id === value)
}
