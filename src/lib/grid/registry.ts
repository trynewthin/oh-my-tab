import type { GridItem } from "./types"

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
  "4x4": { width: 4, height: 4 },
  "4x8": { width: 4, height: 8 },
  "8x4": { width: 8, height: 4 },
  "8x8": { width: 8, height: 8 },
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

export type ComponentSizeDefinition = {
  value: GridItemSize
  occupancy: GridOccupancyId
  label: string
  menuLabel: string
  width: number
  height: number
}

export function gridSize(
  value: GridItemSize,
  occupancy: GridOccupancyId,
  role?: string
): ComponentSizeDefinition {
  const { width, height } = GRID_OCCUPANCY[occupancy]
  const mark = occupancyMark(width, height)
  return {
    value,
    occupancy,
    label: role ? `${role} · ${mark}` : mark,
    menuLabel: mark,
    width,
    height,
  }
}

type ComponentDefinition = {
  label: string
  description: string
  defaultName: string
  defaultColor: string
  defaultSize: GridItemSize
  sizes: readonly ComponentSizeDefinition[]
  menuSizes: readonly GridItemSize[]
  editorSizes: readonly GridItemSize[]
  catalogSizes: readonly GridItemSize[]
  catalogDirectAdd: boolean
  detailPreviewWidth: "compact" | "wide"
  showNameInEditor: boolean
  tileBorder: boolean
  openAction: "edit" | "expand" | "none"
  actions: Readonly<Record<ComponentAction, boolean>>
}

export const componentRegistry = {
  tab: {
    label: "标签",
    description: "打开常用网站。",
    defaultName: "新标签",
    defaultColor: "#6c8bd4",
    defaultSize: "small",
    sizes: [gridSize("small", "4x1", "小"), gridSize("medium", "4x2", "中")],
    menuSizes: ["medium", "small"],
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
    label: "文件夹",
    description: "集中收纳标签。",
    defaultName: "新文件夹",
    defaultColor: "#6c8bd4",
    defaultSize: "large",
    sizes: [
      gridSize("small", "4x2", "小"),
      gridSize("large", "4x4", "大"),
      gridSize("tall", "4x8", "高"),
      gridSize("wide", "8x4", "宽"),
      gridSize("wide-tall", "8x8", "宽高"),
    ],
    menuSizes: ["wide-tall", "wide", "tall", "large"],
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
  "dot-canvas": {
    label: "点阵画布",
    description: "绘制像素图案，或导入图片生成专属点阵装饰。",
    defaultName: "点阵画布",
    defaultColor: "#3291ff",
    defaultSize: "large",
    sizes: [
      gridSize("large", "4x4", "大"),
      gridSize("tall", "4x8", "高"),
      gridSize("wide", "8x4", "宽"),
      gridSize("wide-tall", "8x8", "宽高"),
    ],
    menuSizes: [],
    editorSizes: ["large", "tall", "wide", "wide-tall"],
    catalogSizes: ["large", "tall", "wide", "wide-tall"],
    catalogDirectAdd: false,
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
    label: "像素花盆",
    description: "播种、浇水并陪伴植物成长，收集到你的植物图鉴。",
    defaultName: "像素花盆",
    defaultColor: "#42b883",
    defaultSize: "large",
    sizes: [gridSize("large", "4x4", "大")],
    menuSizes: [],
    editorSizes: [],
    catalogSizes: ["large"],
    catalogDirectAdd: false,
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
    label: "日历",
    description: "查看月历，切换月份，快速回到今天。",
    defaultName: "日历",
    defaultColor: "#3478f6",
    defaultSize: "large",
    sizes: [
      gridSize("small", "4x1", "周"),
      gridSize("medium", "2x2", "日"),
      gridSize("large", "4x4", "月"),
    ],
    menuSizes: ["large", "medium", "small"],
    editorSizes: ["small", "medium", "large"],
    catalogSizes: ["large", "small", "medium"],
    catalogDirectAdd: false,
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
  template: {
    label: "模板",
    description: "标准占位格。1×1 是正方形单位，其它尺寸都是它的整数倍。",
    defaultName: "模板",
    defaultColor: "#8a90a0",
    defaultSize: "small",
    sizes: [
      gridSize("small", "1x1"),
      gridSize("medium", "2x2"),
      gridSize("wide", "4x1"),
      gridSize("large", "4x4"),
    ],
    menuSizes: ["small", "medium", "wide", "large"],
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
    label: "待办",
    description: "记录事项，勾选完成。",
    defaultName: "待办",
    defaultColor: "#6c8bd4",
    defaultSize: "large",
    sizes: [
      gridSize("small", "4x1", "小"),
      gridSize("medium", "4x2", "中"),
      gridSize("large", "4x4", "大"),
    ],
    menuSizes: [],
    editorSizes: [],
    catalogSizes: ["large"],
    catalogDirectAdd: true,
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
} as const satisfies Record<GridItemKind, ComponentDefinition>

export const catalogComponentKinds = [
  "dot-canvas",
  "todo",
  "calendar",
  "ecosystem",
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
      ? definition.menuSizes
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
