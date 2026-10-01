/** Shared keyboard order for a horizontal toolbar and a two-axis radio group. */
export function rovingIndex(
  key: string,
  index: number,
  count: number,
  vertical = false
): number | null {
  if (!Number.isInteger(count) || count <= 0 || index < 0 || index >= count)
    return null
  if (key === "Home") return 0
  if (key === "End") return count - 1
  if (key === "ArrowRight" || (vertical && key === "ArrowDown"))
    return (index + 1) % count
  if (key === "ArrowLeft" || (vertical && key === "ArrowUp"))
    return (index + count - 1) % count
  return null
}
