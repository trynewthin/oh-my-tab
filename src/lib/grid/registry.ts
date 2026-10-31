import type { GridItem } from "./types"
import type { UtilityWidgetKind } from "./utility-types"

export type GridItemKind = GridItem["kind"]
export type GridItemSize = GridItem["size"]

export const GRID_UNIT = 1

/** Components choose from this scale; persisted size tokens stay per-kind. */
export const GRID_OCCUPANCY = {
  "1x1": { width: 1, height: 1 },
  "2x1": { width: 2, height: 1 },
  "2x2": { width: 2, height: 2 },
  "2x4": { width: 2, height: 4 },
  "4x1": { width: 4, height: 1 },
  "4x2": { width: 4, height: 2 },
  "8x1": { width: 8, height: 1 },
  "4x4": { width: 4, height: 4 },
  "4x8": { width: 4, height: 8 },
  "8x4": { width: 8, height: 4 },
  "8x8": { width: 8, height: 8 },
  "12x1": { width: 12, height: 1 },
  "12x2": { width: 12, height: 2 },
} as const

export type GridOccupancyId = keyof typeof GRID_OCCUPANCY

export function occupancyMark(width: number, height: number) {
  return `${width}×${height}`
}

export function occupancyPreviewStyle(width: number, height: number) {
  const frame = Math.max(GRID_OCCUPANCY["4x4"].width, width, height)
  return {
    width: `${(width / frame) * 100}%`,
    aspectRatio: `${width} / ${height}`,
  }
}

export type ComponentAction =
  "resize" | "randomColor" | "dynamicEffect" | "groupable" | "expandable"

// Role word before the locale-independent numeric mark ("Small · 4×1").
export type SizeRole =
  | "small"
  | "medium"
  | "large"
  | "tall"
  | "wide"
  | "wideTall"
  | "week"
  | "day"
  | "month"

export type ComponentSizeDefinition = {
  value: GridItemSize
  occupancy: GridOccupancyId
  roleKey?: string
  width: number
  height: number
}

export type CatalogSection = "common" | "productivity" | "dots" | "fun"

export function gridSize(
  value: GridItemSize,
  occupancy: GridOccupancyId,
  role?: SizeRole
): ComponentSizeDefinition {
  const { width, height } = GRID_OCCUPANCY[occupancy]
  return {
    value,
    occupancy,
    roleKey: role ? `grid.sizeRole.${role}` : undefined,
    width,
    height,
  }
}

/** Minimal shape of `i18n.t`/`useTranslation().t` this module needs. */
export type Translator = (key: string) => string

// Registry entries carry translation keys, never display text, so one
// definition renders in every language.
function utilityDefinition(
  kind: UtilityWidgetKind,
  defaultSize: GridItemSize,
  sizes: readonly ComponentSizeDefinition[],
  catalogSection: CatalogSection = "productivity",
  defaultColor = "#6c8bd4"
): ComponentConfig {
  const values = sizes.map((size) => size.value)
  const appearance = kind !== "photo"
  return {
    labelKey: `grid.component.${kind}.label`,
    descriptionKey: `grid.component.${kind}.description`,
    defaultNameKey: `grid.component.${kind}.defaultName`,
    defaultColor,
    defaultSize,
    sizes,
    catalogSizes: values,
    catalogDirectAdd: true,
    catalogSection,
    detailPreviewWidth: kind === "rss" ? "wide" : "compact",
    showNameInEditor: kind !== "clock",
    tileBorder: kind !== "clock",
    openAction: "edit",
    actions: {
      randomColor: appearance,
      dynamicEffect: appearance && kind !== "clock",
      groupable: false,
      expandable: false,
    },
  }
}

export type ComponentDefinition = {
  labelKey: string
  descriptionKey: string
  defaultNameKey: string
  defaultColor: string
  defaultSize: GridItemSize
  sizes: readonly ComponentSizeDefinition[]
  legacySizes?: readonly ComponentSizeDefinition[]
  catalogSizes: readonly GridItemSize[]
  catalogDirectAdd: boolean
  catalogSection?: CatalogSection
  detailPreviewWidth: "compact" | "wide"
  showNameInEditor: boolean
  tileBorder: boolean
  openAction: "edit" | "expand" | "none"
  actions: Readonly<Record<ComponentAction, boolean>>
}

type ComponentConfig = Omit<ComponentDefinition, "actions"> & {
  actions: Readonly<Record<Exclude<ComponentAction, "resize">, boolean>>
}

function defineComponents(
  definitions: Record<GridItemKind, ComponentConfig>
): Record<GridItemKind, ComponentDefinition> {
  return Object.fromEntries(
    Object.entries(definitions).map(([kind, definition]) => [
      kind,
      {
        ...definition,
        actions: { ...definition.actions, resize: definition.sizes.length > 1 },
      },
    ])
  ) as Record<GridItemKind, ComponentDefinition>
}

export const componentRegistry = defineComponents({
  tab: {
    labelKey: "grid.component.tab.label",
    descriptionKey: "grid.component.tab.description",
    defaultNameKey: "grid.component.tab.defaultName",
    defaultColor: "#6c8bd4",
    defaultSize: "small",
    sizes: [
      gridSize("small", "4x1", "small"),
      gridSize("medium", "4x2", "medium"),
      gridSize("square-small", "1x1"),
      gridSize("square-medium", "2x2"),
      gridSize("square-large", "4x4"),
    ],
    catalogSizes: [],
    catalogDirectAdd: false,
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: false,
    openAction: "none",
    actions: {
      randomColor: true,
      dynamicEffect: true,
      groupable: true,
      expandable: false,
    },
  },
  folder: {
    labelKey: "grid.component.folder.label",
    descriptionKey: "grid.component.folder.description",
    defaultNameKey: "grid.component.folder.defaultName",
    defaultColor: "#6c8bd4",
    defaultSize: "large",
    sizes: [
      gridSize("large", "4x4", "large"),
      gridSize("tall", "4x8", "tall"),
      gridSize("wide", "8x4", "wide"),
      gridSize("wide-tall", "8x8", "wideTall"),
    ],
    legacySizes: [gridSize("small", "4x2", "small")],
    catalogSizes: [],
    catalogDirectAdd: false,
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "expand",
    actions: {
      randomColor: true,
      dynamicEffect: true,
      groupable: true,
      expandable: true,
    },
  },
  button: {
    labelKey: "grid.component.button.label",
    descriptionKey: "grid.component.button.description",
    defaultNameKey: "grid.component.button.defaultName",
    defaultColor: "#6c63ff",
    defaultSize: "small",
    sizes: [gridSize("small", "1x1")],
    catalogSizes: ["small"],
    catalogDirectAdd: true,
    catalogSection: "common",
    detailPreviewWidth: "compact",
    showNameInEditor: false,
    tileBorder: true,
    openAction: "edit",
    actions: {
      randomColor: true,
      dynamicEffect: false,
      groupable: false,
      expandable: false,
    },
  },
  "dot-canvas": {
    labelKey: "grid.component.dotCanvas.label",
    descriptionKey: "grid.component.dotCanvas.description",
    defaultNameKey: "grid.component.dotCanvas.defaultName",
    defaultColor: "#3291ff",
    defaultSize: "large",
    sizes: [
      gridSize("large", "4x4", "large"),
      gridSize("tall", "4x8", "tall"),
      gridSize("wide", "8x4", "wide"),
      gridSize("wide-tall", "8x8", "wideTall"),
    ],
    catalogSizes: ["large", "tall", "wide", "wide-tall"],
    catalogDirectAdd: false,
    catalogSection: "dots",
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: false,
    openAction: "edit",
    actions: {
      randomColor: false,
      dynamicEffect: false,
      groupable: false,
      expandable: false,
    },
  },
  ecosystem: {
    labelKey: "grid.component.ecosystem.label",
    descriptionKey: "grid.component.ecosystem.description",
    defaultNameKey: "grid.component.ecosystem.defaultName",
    defaultColor: "#42b883",
    defaultSize: "large",
    sizes: [gridSize("large", "4x4", "large")],
    catalogSizes: ["large"],
    catalogDirectAdd: false,
    catalogSection: "fun",
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: false,
    openAction: "edit",
    actions: {
      randomColor: false,
      dynamicEffect: false,
      groupable: false,
      expandable: false,
    },
  },
  calendar: {
    labelKey: "grid.component.calendar.label",
    descriptionKey: "grid.component.calendar.description",
    defaultNameKey: "grid.component.calendar.defaultName",
    defaultColor: "#3478f6",
    defaultSize: "large",
    sizes: [
      gridSize("small", "4x1", "week"),
      gridSize("medium", "2x2", "day"),
      gridSize("large", "4x4", "month"),
    ],
    catalogSizes: ["large", "small", "medium"],
    catalogDirectAdd: false,
    catalogSection: "productivity",
    detailPreviewWidth: "wide",
    showNameInEditor: false,
    tileBorder: true,
    openAction: "none",
    actions: {
      randomColor: true,
      dynamicEffect: true,
      groupable: false,
      expandable: false,
    },
  },
  "search-minimal": {
    labelKey: "grid.component.searchMinimal.label",
    descriptionKey: "grid.component.searchMinimal.description",
    defaultNameKey: "grid.component.searchMinimal.defaultName",
    defaultColor: "#6c8bd4",
    defaultSize: "small",
    sizes: [
      gridSize("compact", "4x1"),
      gridSize("medium", "8x1"),
      gridSize("small", "12x1"),
    ],
    catalogSizes: ["compact", "medium", "small"],
    catalogDirectAdd: true,
    catalogSection: "common",
    detailPreviewWidth: "wide",
    showNameInEditor: false,
    tileBorder: false,
    openAction: "none",
    actions: {
      randomColor: false,
      dynamicEffect: false,
      groupable: false,
      expandable: false,
    },
  },
  template: {
    labelKey: "grid.component.template.label",
    descriptionKey: "grid.component.template.description",
    defaultNameKey: "grid.component.template.defaultName",
    defaultColor: "#8a90a0",
    defaultSize: "small",
    sizes: [
      gridSize("small", "1x1"),
      gridSize("medium", "2x2"),
      gridSize("wide", "4x1"),
      gridSize("large", "4x4"),
    ],
    catalogSizes: ["small", "medium", "wide", "large"],
    catalogDirectAdd: false,
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "edit",
    actions: {
      randomColor: true,
      dynamicEffect: true,
      groupable: false,
      expandable: false,
    },
  },
  todo: {
    labelKey: "grid.component.todo.label",
    descriptionKey: "grid.component.todo.description",
    defaultNameKey: "grid.component.todo.defaultName",
    defaultColor: "#6c8bd4",
    defaultSize: "large",
    sizes: [gridSize("large", "4x4", "large")],
    legacySizes: [
      gridSize("small", "4x1", "small"),
      gridSize("medium", "4x2", "medium"),
    ],
    catalogSizes: ["large"],
    catalogDirectAdd: true,
    catalogSection: "productivity",
    detailPreviewWidth: "wide",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "none",
    actions: {
      randomColor: true,
      dynamicEffect: true,
      groupable: false,
      expandable: true,
    },
  },
  clock: utilityDefinition(
    "clock",
    "medium",
    [
      gridSize("small", "2x1", "small"),
      gridSize("medium", "4x2", "medium"),
      gridSize("tall", "2x4", "tall"),
    ],
    "common"
  ),
  countdown: utilityDefinition(
    "countdown",
    "small",
    [gridSize("small", "2x2", "small"), gridSize("wide", "4x1", "wide")],
    "productivity",
    "#d49b6c"
  ),
  note: utilityDefinition(
    "note",
    "large",
    [
      gridSize("large", "4x4", "large"),
      gridSize("tall", "4x8", "tall"),
      gridSize("wide", "8x4", "wide"),
    ],
    "productivity",
    "#d4bd6c"
  ),
  workday: utilityDefinition(
    "workday",
    "medium",
    [gridSize("medium", "4x2", "medium")],
    "productivity",
    "#68bda4"
  ),
  pomodoro: utilityDefinition(
    "pomodoro",
    "large",
    [gridSize("large", "4x4", "large")],
    "productivity",
    "#df716b"
  ),
  weather: utilityDefinition(
    "weather",
    "large",
    [gridSize("medium", "4x2", "medium"), gridSize("large", "4x4", "large")],
    "common",
    "#5ba9d1"
  ),
  photo: utilityDefinition(
    "photo",
    "large",
    [
      gridSize("large", "4x4", "large"),
      gridSize("tall", "4x8", "tall"),
      gridSize("wide", "8x4", "wide"),
      gridSize("wide-tall", "8x8", "wideTall"),
    ],
    "fun",
    "#8a90a0"
  ),
  rss: utilityDefinition(
    "rss",
    "wide",
    [gridSize("wide", "8x4", "wide")],
    "common",
    "#d49b6c"
  ),
  "world-clock": utilityDefinition(
    "world-clock",
    "large",
    [gridSize("large", "4x4", "large")],
    "productivity",
    "#8b7bc8"
  ),
})

// Only these can be added; other registered utilities remain available to
// saved layouts.
export const catalogComponentKinds = [
  "clock",
  "button",
  "dot-canvas",
  "todo",
  "calendar",
  "pomodoro",
  "countdown",
  "workday",
  "search-minimal",
  "ecosystem",
] as const satisfies readonly GridItemKind[]

export type CatalogComponentKind = (typeof catalogComponentKinds)[number]
export type SizeOptionContext = "resize" | "editor" | "catalog"

export function isGridItemKind(value: unknown): value is GridItemKind {
  return (
    typeof value === "string" &&
    Object.prototype.hasOwnProperty.call(componentRegistry, value)
  )
}

export function getComponentDefinition(
  kind: GridItemKind
): ComponentDefinition {
  return componentRegistry[kind]
}

export function componentLabel(kind: GridItemKind, t: Translator): string {
  return t(getComponentDefinition(kind).labelKey)
}

export function componentDescription(
  kind: GridItemKind,
  t: Translator
): string {
  return t(getComponentDefinition(kind).descriptionKey)
}

export function componentDefaultName(
  kind: GridItemKind,
  t: Translator
): string {
  return t(getComponentDefinition(kind).defaultNameKey)
}

export function sizeLabel(
  size: Pick<ComponentSizeDefinition, "roleKey" | "width" | "height">,
  t: Translator
): string {
  const mark = occupancyMark(size.width, size.height)
  return size.roleKey ? `${t(size.roleKey)} · ${mark}` : mark
}

export function getComponentSize(
  kind: GridItemKind,
  size: unknown
): ComponentSizeDefinition | undefined {
  const definition = getComponentDefinition(kind)
  return (
    definition.sizes.find((entry) => entry.value === size) ??
    definition.legacySizes?.find((entry) => entry.value === size)
  )
}

export function isComponentSize(
  kind: GridItemKind,
  size: unknown
): size is GridItemSize {
  return getComponentSize(kind, size) !== undefined
}

export function getComponentSizeOptions(
  kind: GridItemKind,
  context: SizeOptionContext
): readonly ComponentSizeDefinition[] {
  const definition = getComponentDefinition(kind)
  if (context !== "catalog") return definition.sizes
  return definition.catalogSizes.flatMap((value) => {
    const size = getComponentSize(kind, value)
    return size ? [size] : []
  })
}

export function supportsComponentAction(
  kind: GridItemKind,
  action: ComponentAction
): boolean {
  return getComponentDefinition(kind).actions[action]
}

export function getItemGridDimensions(
  item: Pick<GridItem, "kind" | "size">,
  columns = 24
) {
  const size = getComponentSize(item.kind, item.size)
  return {
    width: Math.min(columns, size?.width ?? GRID_UNIT),
    height: size?.height ?? GRID_UNIT,
  }
}
