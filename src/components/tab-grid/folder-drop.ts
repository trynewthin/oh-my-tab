export const FOLDER_CHARGE_DURATION = 550
export const FOLDER_RELEASE_DURATION = 550
export const FOLDER_MERGE_THRESHOLD = 0.42

type Point = { x: number; y: number }
export type Bounds = {
  left: number
  top: number
  width: number
  height: number
}

export function overlapRatio(a: Bounds, b: Bounds) {
  const width = Math.max(
    0,
    Math.min(a.left + a.width, b.left + b.width) - Math.max(a.left, b.left)
  )
  const height = Math.max(
    0,
    Math.min(a.top + a.height, b.top + b.height) - Math.max(a.top, b.top)
  )
  const overlap = width * height
  const smaller = Math.min(a.width * a.height, b.width * b.height)
  return smaller <= 0 ? 0 : overlap / smaller
}

export function draggedBounds(
  point: Point,
  grabOffset: Point,
  size: { width: number; height: number }
): Bounds {
  return {
    left: point.x - grabOffset.x,
    top: point.y - grabOffset.y,
    width: size.width,
    height: size.height,
  }
}

export function mixHexColor(from: string, to: string, amount: number) {
  const parse = (value: string) => {
    const hex = value.replace("#", "")
    const normalized =
      hex.length === 3
        ? hex
            .split("")
            .map((part) => part + part)
            .join("")
        : hex
    return [
      Number.parseInt(normalized.slice(0, 2), 16),
      Number.parseInt(normalized.slice(2, 4), 16),
      Number.parseInt(normalized.slice(4, 6), 16),
    ] as const
  }
  const start = parse(from)
  const end = parse(to)
  const mix = (left: number, right: number) =>
    Math.round(left + (right - left) * amount)
      .toString(16)
      .padStart(2, "0")
  return `#${mix(start[0], end[0])}${mix(start[1], end[1])}${mix(start[2], end[2])}`
}

export function folderMergeProgress(ratio: number) {
  return Math.max(
    0,
    Math.min(1, (ratio - 0.12) / (FOLDER_MERGE_THRESHOLD - 0.12))
  )
}

export function confirmedFolderDrop(ratio: number) {
  return ratio >= FOLDER_MERGE_THRESHOLD
}
