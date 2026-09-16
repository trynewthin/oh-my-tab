import type { GridItem } from "./types"

export type GridItemKind = GridItem["kind"]
export type GridItemSize = GridItem["size"]
export type ComponentAction =
  "resize" | "randomColor" | "dynamicEffect" | "groupable" | "expandable"

export type ComponentSizeDefinition = {
  value: GridItemSize
  label: string
  menuLabel: string
  width: number
  height: number
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
    sizes: [
      {
        value: "small",
        label: "小 · 4×1",
        menuLabel: "4×1",
        width: 4,
        height: 1,
      },
      {
        value: "medium",
        label: "中 · 4×2",
        menuLabel: "4×2",
        width: 4,
        height: 2,
      },
    ],
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
      {
        value: "small",
        label: "小 · 4×2",
        menuLabel: "4×2",
        width: 4,
        height: 2,
      },
      {
        value: "large",
        label: "大 · 4×4",
        menuLabel: "4×4",
        width: 4,
        height: 4,
      },
      {
        value: "tall",
        label: "高 · 4×8",
        menuLabel: "4×8",
        width: 4,
        height: 8,
      },
      {
        value: "wide",
        label: "宽 · 8×4",
        menuLabel: "8×4",
        width: 8,
        height: 4,
      },
      {
        value: "wide-tall",
        label: "宽高 · 8×8",
        menuLabel: "8×8",
        width: 8,
        height: 8,
      },
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
      {
        value: "large",
        label: "大 · 4×4",
        menuLabel: "4×4",
        width: 4,
        height: 4,
      },
      {
        value: "tall",
        label: "高 · 4×8",
        menuLabel: "4×8",
        width: 4,
        height: 8,
      },
      {
        value: "wide",
        label: "宽 · 8×4",
        menuLabel: "8×4",
        width: 8,
        height: 4,
      },
      {
        value: "wide-tall",
        label: "宽高 · 8×8",
        menuLabel: "8×8",
        width: 8,
        height: 8,
      },
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
    sizes: [
      {
        value: "large",
        label: "大 · 4×4",
        menuLabel: "4×4",
        width: 4,
        height: 4,
      },
    ],
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
      {
        value: "small",
        label: "周 · 4×1",
        menuLabel: "4×1",
        width: 4,
        height: 1,
      },
      {
        value: "medium",
        label: "日 · 2×2",
        menuLabel: "2×2",
        width: 2,
        height: 2,
      },
      {
        value: "large",
        label: "月 · 4×4",
        menuLabel: "4×4",
        width: 4,
        height: 4,
      },
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
  todo: {
    label: "待办",
    description: "记录事项，勾选完成。",
    defaultName: "待办",
    defaultColor: "#6c8bd4",
    defaultSize: "large",
    sizes: [
      {
        value: "small",
        label: "小 · 4×1",
        menuLabel: "4×1",
        width: 4,
        height: 1,
      },
      {
        value: "medium",
        label: "中 · 4×2",
        menuLabel: "4×2",
        width: 4,
        height: 2,
      },
      {
        value: "large",
        label: "大 · 4×4",
        menuLabel: "4×4",
        width: 4,
        height: 4,
      },
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
    width: Math.min(columns, size?.width ?? 4),
    height: size?.height ?? 1,
  }
}
