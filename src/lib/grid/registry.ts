import type { GridItem } from "./types"
import { utilityWidgetKinds, type UtilityWidgetKind } from "./utility-types"

export type GridItemKind = GridItem["kind"]
export type GridItemSize = GridItem["size"]

/** One grid cell. Width 1 and height 1 always form a square. */
export const GRID_UNIT = 1

/**
 * Allowed occupancies. Components pick from this scale; they do not invent
 * widths or heights. Persisted size tokens (small, large, …) stay per-kind.
 */
export const GRID_OCCUPANCY = {
  "1x1": { width: 1, height: 1 },
  "2x2": { width: 2, height: 2 },
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

export type ComponentMenuOperation =
  "refreshIcon" | "edit" | "randomColor" | "dynamicEffect"

// Occupancy role vocabulary. The role is the word shown before the size mark
// ("Small · 4×1"); the mark itself is numeric and locale-independent.
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

// Registry entries carry translation keys, never display text: the same
// definition must render in every language without being rebuilt.
function utilityDefinition(
  kind: UtilityWidgetKind,
  defaultSize: GridItemSize,
  sizes: readonly ComponentSizeDefinition[],
  catalogSection: CatalogSection = "productivity",
  defaultColor = "#6c8bd4"
): ComponentDefinition {
  const values = sizes.map((size) => size.value)
  const appearance = kind !== "photo"
  return {
    labelKey: `grid.component.${kind}.label`,
    descriptionKey: `grid.component.${kind}.description`,
    defaultNameKey: `grid.component.${kind}.defaultName`,
    defaultColor,
    defaultSize,
    sizes,
    menu: {
      sizes: values.length > 1 ? values : [],
      operations: appearance
        ? ["edit", "randomColor", "dynamicEffect"]
        : ["edit"],
    },
    editorSizes: values,
    catalogSizes: values,
    catalogDirectAdd: true,
    catalogSection,
    detailPreviewWidth: kind === "rss" ? "wide" : "compact",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "edit",
    actions: {
      resize: values.length > 1,
      randomColor: appearance,
      dynamicEffect: appearance,
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
  menu: {
    sizes: readonly GridItemSize[]
    operations: readonly ComponentMenuOperation[]
  }
  editorSizes: readonly GridItemSize[]
  catalogSizes: readonly GridItemSize[]
  catalogDirectAdd: boolean
  catalogSection?: CatalogSection
  detailPreviewWidth: "compact" | "wide"
  showNameInEditor: boolean
  tileBorder: boolean
  openAction: "edit" | "expand" | "none"
  actions: Readonly<Record<ComponentAction, boolean>>
}

export const componentRegistry = {
  tab: {
    labelKey: "grid.component.tab.label",
    descriptionKey: "grid.component.tab.description",
    defaultNameKey: "grid.component.tab.defaultName",
    defaultColor: "#6c8bd4",
    defaultSize: "small",
    sizes: [
      gridSize("small", "4x1", "small"),
      gridSize("medium", "4x2", "medium"),
    ],
    menu: {
      sizes: ["medium", "small"],
      operations: ["refreshIcon", "edit", "randomColor", "dynamicEffect"],
    },
    editorSizes: ["small", "medium"],
    catalogSizes: [],
    catalogDirectAdd: false,
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "none",
    actions: {
      resize: true,
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
      gridSize("small", "4x2", "small"),
      gridSize("large", "4x4", "large"),
      gridSize("tall", "4x8", "tall"),
      gridSize("wide", "8x4", "wide"),
      gridSize("wide-tall", "8x8", "wideTall"),
    ],
    menu: {
      sizes: ["wide-tall", "wide", "tall", "large"],
      operations: ["edit", "randomColor", "dynamicEffect"],
    },
    editorSizes: ["large", "tall", "wide", "wide-tall"],
    catalogSizes: [],
    catalogDirectAdd: false,
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "expand",
    actions: {
      resize: true,
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
    menu: {
      sizes: [],
      operations: ["edit", "randomColor"],
    },
    editorSizes: [],
    catalogSizes: ["small"],
    catalogDirectAdd: true,
    catalogSection: "common",
    detailPreviewWidth: "compact",
    showNameInEditor: false,
    tileBorder: true,
    openAction: "edit",
    actions: {
      resize: false,
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
    menu: {
      sizes: [],
      operations: ["edit"],
    },
    editorSizes: ["large", "tall", "wide", "wide-tall"],
    catalogSizes: ["large", "tall", "wide", "wide-tall"],
    catalogDirectAdd: false,
    catalogSection: "dots",
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: false,
    openAction: "edit",
    actions: {
      resize: false,
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
    menu: {
      sizes: [],
      operations: ["edit"],
    },
    editorSizes: [],
    catalogSizes: ["large"],
    catalogDirectAdd: false,
    catalogSection: "fun",
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: false,
    openAction: "edit",
    actions: {
      resize: false,
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
    menu: {
      sizes: ["large", "medium", "small"],
      operations: ["edit", "randomColor", "dynamicEffect"],
    },
    editorSizes: ["small", "medium", "large"],
    catalogSizes: ["large", "small", "medium"],
    catalogDirectAdd: false,
    catalogSection: "productivity",
    detailPreviewWidth: "wide",
    showNameInEditor: false,
    tileBorder: true,
    openAction: "none",
    actions: {
      resize: true,
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
    menu: {
      sizes: ["compact", "medium", "small"],
      operations: [],
    },
    editorSizes: [],
    catalogSizes: ["compact", "medium", "small"],
    catalogDirectAdd: true,
    catalogSection: "common",
    detailPreviewWidth: "wide",
    showNameInEditor: false,
    tileBorder: false,
    openAction: "none",
    actions: {
      resize: true,
      randomColor: false,
      dynamicEffect: false,
      groupable: false,
      expandable: false,
    },
  },
  "search-full": {
    labelKey: "grid.component.searchFull.label",
    descriptionKey: "grid.component.searchFull.description",
    defaultNameKey: "grid.component.searchFull.defaultName",
    defaultColor: "#6c8bd4",
    defaultSize: "medium",
    sizes: [gridSize("medium", "12x2")],
    menu: {
      sizes: [],
      operations: [],
    },
    editorSizes: [],
    catalogSizes: ["medium"],
    catalogDirectAdd: true,
    catalogSection: "common",
    detailPreviewWidth: "wide",
    showNameInEditor: false,
    tileBorder: false,
    openAction: "none",
    actions: {
      resize: false,
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
    menu: {
      sizes: ["small", "medium", "wide", "large"],
      operations: ["edit", "randomColor", "dynamicEffect"],
    },
    editorSizes: ["small", "medium", "wide", "large"],
    catalogSizes: ["small", "medium", "wide", "large"],
    catalogDirectAdd: false,
    detailPreviewWidth: "compact",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "edit",
    actions: {
      resize: true,
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
    sizes: [
      gridSize("small", "4x1", "small"),
      gridSize("medium", "4x2", "medium"),
      gridSize("large", "4x4", "large"),
    ],
    menu: {
      sizes: [],
      operations: ["edit", "randomColor", "dynamicEffect"],
    },
    editorSizes: [],
    catalogSizes: ["large"],
    catalogDirectAdd: true,
    catalogSection: "productivity",
    detailPreviewWidth: "wide",
    showNameInEditor: true,
    tileBorder: true,
    openAction: "none",
    actions: {
      resize: false,
      randomColor: true,
      dynamicEffect: true,
      groupable: false,
      expandable: true,
    },
  },
  clock: utilityDefinition(
    "clock",
    "large",
    [
      gridSize("small", "4x1", "small"),
      gridSize("medium", "4x2", "medium"),
      gridSize("large", "4x4", "large"),
    ],
    "common"
  ),
  countdown: utilityDefinition(
    "countdown",
    "medium",
    [
      gridSize("medium", "4x2", "medium"),
      gridSize("large", "4x4", "large"),
    ],
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
    [
      gridSize("medium", "4x2", "medium"),
      gridSize("large", "4x4", "large"),
    ],
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
  "bookmark-list": utilityDefinition(
    "bookmark-list",
    "large",
    [
      gridSize("large", "4x4", "large"),
      gridSize("tall", "4x8", "tall"),
    ],
    "common",
    "#72a483"
  ),
  rss: utilityDefinition(
    "rss",
    "wide",
    [gridSize("wide", "8x4", "wide")],
    "common",
    "#d49b6c"
  ),
  "github-repo": utilityDefinition(
    "github-repo",
    "large",
    [
      gridSize("medium", "4x2", "medium"),
      gridSize("large", "4x4", "large"),
    ],
    "productivity",
    "#8a90a0"
  ),
  "world-clock": utilityDefinition(
    "world-clock",
    "large",
    [gridSize("large", "4x4", "large")],
    "productivity",
    "#8b7bc8"
  ),
} as const satisfies Record<GridItemKind, ComponentDefinition>

export const catalogComponentKinds = [
  "button",
  "dot-canvas",
  "todo",
  "calendar",
  "search-minimal",
  "ecosystem",
  ...utilityWidgetKinds,
] as const satisfies readonly GridItemKind[]

export type CatalogComponentKind = (typeof catalogComponentKinds)[number]
export type SizeOptionContext = "menu" | "editor" | "catalog"

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

/**
 * Resolves registry display metadata through the active language. Every
 * consumer renders these at call time so a language switch re-renders chrome
 * without rebuilding the registry.
 */
export function componentLabel(kind: GridItemKind, t: Translator): string {
  return t(getComponentDefinition(kind).labelKey)
}

export function componentDescription(
  kind: GridItemKind,
  t: Translator
): string {
  return t(getComponentDefinition(kind).descriptionKey)
}

/** Product-owned default name, in the language active at creation time. */
export function componentDefaultName(
  kind: GridItemKind,
  t: Translator
): string {
  return t(getComponentDefinition(kind).defaultNameKey)
}

/** "Small · 4×1" — role word first when the size has one, else the mark. */
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
  return getComponentDefinition(kind).sizes.find(
    (entry) => entry.value === size
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
  context: SizeOptionContext,
  currentSize?: GridItemSize
): ComponentSizeDefinition[] {
  const definition = getComponentDefinition(kind)
  const configured =
    context === "menu"
      ? definition.menu.sizes
      : context === "catalog"
        ? definition.catalogSizes
        : definition.editorSizes
  const values = [...configured] as GridItemSize[]
  if (
    context === "editor" &&
    definition.actions.resize &&
    currentSize !== undefined &&
    isComponentSize(kind, currentSize) &&
    !values.includes(currentSize)
  )
    values.unshift(currentSize)
  return values.flatMap((value) => {
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

export function getComponentMenuOperations(
  kind: GridItemKind
): readonly ComponentMenuOperation[] {
  return getComponentDefinition(kind).menu.operations
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
