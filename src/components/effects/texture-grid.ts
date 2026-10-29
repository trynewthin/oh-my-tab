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
export function textureGrid(width: number, height: number): TextureGrid {
  const columns =
    width > 0 ? Math.ceil((width + TEXTURE_GAP) / TEXTURE_STEP) : 0
  const rows = Math.max(0, Math.ceil(height / TEXTURE_STEP))
  const gridWidth = Math.max(0, columns * TEXTURE_STEP - TEXTURE_GAP)
  return {
    columns,
    rows,
    width,
    height,
    left: width - gridWidth,
    top: 0,
  }
}
