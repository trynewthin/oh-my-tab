import { getComponentSizeOptions, type GridItemSize } from "./registry"
import type { GridItem } from "./types"

export function resolveResizeSize(
  item: GridItem,
  columns: number,
  width: number,
  height: number,
  {
    currentSize = item.size,
    hysteresis = 0,
  }: {
    currentSize?: GridItemSize
    hysteresis?: number
  } = {}
): GridItemSize {
  const options = getComponentSizeOptions(item.kind, "resize")
  let result = currentSize
  let distance = Infinity
  for (const option of options) {
    if (option.width > columns) continue
    const next = (option.width - width) ** 2 + (option.height - height) ** 2
    if (
      next < distance ||
      (next === distance && option.value === currentSize)
    ) {
      result = option.value
      distance = next
    }
  }
  if (hysteresis <= 0 || result === currentSize) return result
  const current = options.find((option) => option.value === currentSize)
  const target = options.find((option) => option.value === result)
  if (current && target && current.width <= columns && current !== target) {
    const currentDistance =
      (current.width - width) ** 2 + (current.height - height) ** 2
    const margin =
      2 *
      hysteresis *
      Math.hypot(current.width - target.width, current.height - target.height)
    if (currentDistance - distance <= margin) return currentSize
  }
  return result
}
