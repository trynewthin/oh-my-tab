export const FOLDER_DWELL = 550

export type FolderHover = {
  folderId: string
  startedAt: number
  ready: boolean
}

type Point = { x: number; y: number }
type Bounds = { left: number; top: number; width: number; height: number }

export function confirmedFolderDrop(
  hover: FolderHover | null,
  point: Point,
  bounds: Bounds | null,
  now: number
): string | null {
  if (!hover || !bounds) return null
  const insetX = hover.ready ? 0 : bounds.width * 0.22
  const insetY = hover.ready ? 0 : bounds.height * 0.18
  const inside =
    point.x >= bounds.left + insetX &&
    point.x <= bounds.left + bounds.width - insetX &&
    point.y >= bounds.top + insetY &&
    point.y <= bounds.top + bounds.height - insetY
  return inside && (hover.ready || now - hover.startedAt >= FOLDER_DWELL)
    ? hover.folderId
    : null
}
