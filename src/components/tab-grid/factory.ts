import { blankDots, canvasDimensions } from "./dot-canvas-data"
import {
  getComponentDefinition,
  getComponentSizeOptions,
  isComponentSize,
  type CatalogComponentKind,
  type GridItemSize,
} from "@/lib/grid/registry"
import type {
  FolderItem,
  GridItem,
  TabEntry,
  TabItem,
  TemplateItem,
} from "@/lib/grid/types"

type CatalogItem = Extract<GridItem, { kind: CatalogComponentKind }>
export type ConfigurableItem = Exclude<
  GridItem,
  { kind: "dot-canvas" | "ecosystem" }
>

export function configureComponent({
  existing,
  id,
  kind,
  name,
  size,
  color,
  url,
}: {
  existing?: ConfigurableItem
  id: string
  kind: ConfigurableItem["kind"]
  name: string
  size: GridItemSize
  color: string
  url?: string
}): ConfigurableItem {
  if (!isComponentSize(kind, size))
    throw new Error(`Unsupported ${kind} size: ${size}`)
  if (kind === "tab") {
    if (!url) throw new Error("A tab URL is required")
    return {
      id,
      kind,
      name,
      url,
      color,
      size: size as TabItem["size"],
      dynamicEffect: existing?.kind === "tab" ? existing.dynamicEffect : false,
    }
  }
  if (kind === "folder")
    return {
      id,
      kind,
      name,
      color,
      size: size as FolderItem["size"],
      tabs: existing?.kind === "folder" ? existing.tabs : [],
      dynamicEffect:
        existing?.kind === "folder" ? existing.dynamicEffect : false,
    }
  if (kind === "calendar")
    return {
      id,
      kind,
      name,
      color,
      size: size as Extract<GridItem, { kind: "calendar" }>["size"],
      dynamicEffect: existing?.dynamicEffect ?? false,
    }
  if (kind === "template")
    return {
      id,
      kind,
      name,
      color,
      size: size as TemplateItem["size"],
      dynamicEffect:
        existing?.kind === "template" ? existing.dynamicEffect : false,
    }
  return {
    id,
    kind,
    name,
    color,
    size: size as Extract<GridItem, { kind: "todo" }>["size"],
    tasks: existing?.kind === "todo" ? existing.tasks : [],
    dynamicEffect: existing?.dynamicEffect ?? false,
  }
}

export function createTabItem({
  name,
  url,
  color,
}: {
  name: string
  url: string
  color?: string
}): TabItem {
  const definition = getComponentDefinition("tab")
  return {
    id: crypto.randomUUID(),
    kind: "tab",
    name,
    url,
    size: "small",
    color: color ?? definition.defaultColor,
  }
}

export function createFolderItem({
  name,
  tabs = [],
  color,
}: {
  name: string
  tabs?: TabEntry[]
  color?: string
}): FolderItem {
  const definition = getComponentDefinition("folder")
  return {
    id: crypto.randomUUID(),
    kind: "folder",
    name,
    tabs,
    size: "large",
    color: color ?? definition.defaultColor,
    dynamicEffect: false,
  }
}

export const bookmarkItemFactory = {
  createTab: createTabItem,
  createFolder: createFolderItem,
}

export function createCatalogComponent(
  kind: CatalogComponentKind,
  requestedSize?: GridItemSize
): CatalogItem {
  const definition = getComponentDefinition(kind)
  const sizes = getComponentSizeOptions(kind, "catalog")
  const size =
    sizes.find((entry) => entry.value === requestedSize)?.value ??
    definition.defaultSize
  const shared = {
    id: crypto.randomUUID(),
    name: definition.defaultName,
    color: definition.defaultColor,
  }

  if (kind === "todo") return { ...shared, kind, size: "large", tasks: [] }
  if (kind === "template")
    return {
      ...shared,
      kind,
      size: size as TemplateItem["size"],
    }
  if (kind === "calendar")
    return {
      ...shared,
      kind,
      size: size as Extract<GridItem, { kind: "calendar" }>["size"],
    }
  if (kind === "ecosystem")
    return {
      ...shared,
      kind,
      size: "large",
      species: "flowers",
      plants: [],
    }

  const dotSize = size as Extract<GridItem, { kind: "dot-canvas" }>["size"]
  const dimensions = canvasDimensions(dotSize)
  return {
    ...shared,
    kind,
    size: dotSize,
    pixels: blankDots(dimensions.columns, dimensions.rows),
    pixelColumns: dimensions.columns,
  }
}
