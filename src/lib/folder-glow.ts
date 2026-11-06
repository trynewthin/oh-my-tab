export function resolveFolderGlow(id: string) {
  let hash = 2166136261
  for (const character of id) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619)
  }
  const horizontal = (hash & 255) / 255
  const vertical = ((hash >>> 8) & 255) / 255
  return {
    x: hash & 256 ? 1.05 + horizontal * 0.25 : -0.05 - horizontal * 0.25,
    y: hash & 65536 ? 1.05 + vertical * 0.2 : -0.05 - vertical * 0.2,
    radiusX: 1.25 + horizontal * 0.65,
    radiusY: 1.15 + vertical * 0.6,
    opacity: 0.28 + ((hash >>> 24) / 255) * 0.12,
    phase: horizontal * Math.PI * 2,
    speed: 0.22 + vertical * 0.12,
  }
}
