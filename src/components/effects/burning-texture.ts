export function textureSeed(value: string) {
  let hash = 2166136261
  for (const character of value)
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  return hash >>> 0
}

function randomAt(seed: number, x: number, y: number) {
  let hash = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263)
  hash = Math.imul(hash ^ (hash >>> 13), 1274126177)
  return ((hash ^ (hash >>> 16)) >>> 0) / 4294967296
}

function flowingNoise(seed: number, x: number, y: number) {
  const row = Math.floor(y)
  const fraction = y - row
  const blend = fraction * fraction * (3 - 2 * fraction)
  return (
    randomAt(seed, x, row) * (1 - blend) + randomAt(seed, x, row + 1) * blend
  )
}

export function burningCell(
  color: string,
  seed: number,
  x: number,
  y: number,
  columns: number,
  time?: number,
  visibility = 1,
  amplitude = 1
) {
  if (visibility <= 0) return "transparent"
  const moving = time !== undefined && amplitude > 0
  const phase = moving ? time * 1.5 : 0
  const edgeNoise = moving
    ? flowingNoise(seed, 0, y + phase * 0.45)
    : randomAt(seed, 0, y)
  const baseEdge = moving
    ? columns * (0.385 + (edgeNoise - 0.5) * 0.33 * amplitude)
    : Math.floor(columns * (0.385 + (edgeNoise - 0.5) * 0.33 * amplitude))
  const noise = moving
    ? flowingNoise(seed, x + 11, y + 7 + phase)
    : randomAt(seed, x + 11, y + 7)
  const recession = 1 - visibility
  const edge =
    baseEdge +
    recession * (columns + 5 - baseEdge) +
    recession * Math.sin(y * 0.7 + phase) * 2
  const distance = x - edge
  const ember = distance < 0 && distance >= -3 && noise > 0.78
  const visible = distance >= 0 ? distance > 2 || noise > 0.18 : ember
  if (!visible) return "transparent"
  const coverage = moving
    ? ember
      ? Math.min(1, (noise - 0.78) / 0.15)
      : Math.min(1, Math.max(0, distance + 0.5))
    : 1
  const strength =
    (ember
      ? 12 + noise * 15
      : 12 + (x / Math.max(1, columns - 1)) * 24 + noise * 12) *
    coverage *
    (0.25 + visibility * 0.75)
  return `color-mix(in srgb, ${color} ${strength}%, transparent)`
}
