export const TEXTURE_CELL_SIZE = 8
export const TEXTURE_GAP = 1
export const TEXTURE_STEP = TEXTURE_CELL_SIZE + TEXTURE_GAP

export type TextureGrid = {
  columns: number
  rows: number
  width: number
  height: number
  left: number
  top: number
}

/** Fixed square cells start at the top; the surface clips the final row. */
export function textureGrid(
  width: number,
  height: number,
  cellSize = TEXTURE_CELL_SIZE,
  gap = TEXTURE_GAP
): TextureGrid {
  const step = cellSize + gap
  const columns = width > 0 ? Math.ceil((width + gap) / step) : 0
  const rows = Math.max(0, Math.ceil(height / step))
  const gridWidth = Math.max(0, columns * step - gap)
  return {
    columns,
    rows,
    width,
    height,
    left: width - gridWidth,
    top: 0,
  }
}
