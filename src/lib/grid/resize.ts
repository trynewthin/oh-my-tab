import { getComponentSizeOptions, type GridItemSize } from "./registry"
import type { GridItem } from "./types"

export function resolveResizeSize(
  item: GridItem,
  columns: number,
  width: number,
  height: number
): GridItemSize {
  const options = getComponentSizeOptions(item.kind, "editor", item.size)
  let result = item.size
  let distance = Infinity
  for (const option of options) {
    if (option.width > columns) continue
    const next = (option.width - width) ** 2 + (option.height - height) ** 2
    if (next < distance || (next === distance && option.value === item.size)) {
      result = option.value
      distance = next
    }
  }
  return result
}
