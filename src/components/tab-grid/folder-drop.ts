export const FOLDER_DWELL = 550
export const FOLDER_HIT_OUTSET = 8
export const FOLDER_CENTER_INSET_X = 0.12
export const FOLDER_CENTER_INSET_Y = 0.1

export type FolderHover = {
  folderId: string
  startedAt: number
  ready: boolean
}

type Point = { x: number; y: number }
type Bounds = { left: number; top: number; width: number; height: number }

export function expandFolderBounds(bounds: Bounds): Bounds {
  return {
    left: bounds.left - FOLDER_HIT_OUTSET,
    top: bounds.top - FOLDER_HIT_OUTSET,
    width: bounds.width + FOLDER_HIT_OUTSET * 2,
    height: bounds.height + FOLDER_HIT_OUTSET * 2,
  }
}

export function folderInsertionIndex(
  remainingCount: number,
  point: Point,
  surface: HTMLElement | null
): number {
  if (!surface || remainingCount <= 0) return Math.max(0, remainingCount)
  const viewport = surface.getBoundingClientRect()
  const list = surface.querySelector<HTMLElement>('[role="list"]')
  const sample = Array.from(
    surface.querySelectorAll<HTMLElement>("[data-stack-row]")
  ).find((row) => row.dataset.tabId && !row.inert)
  if (!list || !sample) return remainingCount
  const listStyle = getComputedStyle(list)
  const columns = Math.max(
    1,
    listStyle.gridTemplateColumns.split(" ").filter(Boolean).length
  )
  const rowGap = parseFloat(listStyle.rowGap)
  const sampleStyle = getComputedStyle(sample)
  const gap =
    Number.isFinite(rowGap) && rowGap > 0
      ? rowGap
      : parseFloat(sampleStyle.marginBottom) || 0
  const height = sample.offsetHeight
  const rowStep = height + gap
  if (rowStep <= 0) return remainingCount
  const localY = point.y - viewport.top + surface.scrollTop - list.offsetTop
  const localX = point.x - viewport.left - list.offsetLeft
  const colWidth = list.clientWidth / columns
  for (let index = 0; index < remainingCount; index++) {
    const row = Math.floor(index / columns)
    const col = index % columns
    const top = row * rowStep
    const left = col * colWidth
    if (columns > 1) {
      if (
        localY < top ||
        (localY <= top + height && localX < left + colWidth / 2)
      )
        return index
    } else if (localY < top + height / 2) {
      return index
    }
  }
  return remainingCount
}

export function confirmedFolderDrop(
  hover: FolderHover | null,
  point: Point,
  bounds: Bounds | null,
  now: number
): string | null {
  if (!hover || !bounds) return null
  const insetX = hover.ready ? 0 : bounds.width * FOLDER_CENTER_INSET_X
  const insetY = hover.ready ? 0 : bounds.height * FOLDER_CENTER_INSET_Y
  const inside =
    point.x >= bounds.left + insetX &&
    point.x <= bounds.left + bounds.width - insetX &&
    point.y >= bounds.top + insetY &&
    point.y <= bounds.top + bounds.height - insetY
  return inside && (hover.ready || now - hover.startedAt >= FOLDER_DWELL)
    ? hover.folderId
    : null
}
