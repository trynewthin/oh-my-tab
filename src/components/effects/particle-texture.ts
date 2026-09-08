type Point = { x: number; y: number }
function random(seed: number, x: number, y: number) {
  const value = Math.sin(seed * 0.0001 + x * 127.1 + y * 311.7) * 43758.5453
  return value - Math.floor(value)
}

export function createParticleCell(
  color: string,
  seed: number,
  x: number,
  y: number,
  columns: number
) {
  const scatter = random(seed, x, y)
  const band = Math.floor(y / 5)
  const fraction = y / 5 - band
  const blend = fraction * fraction * (3 - 2 * fraction)
  const edgeNoise =
    random(seed, 401, band) * (1 - blend) + random(seed, 401, band + 1) * blend
  const edge = columns * (0.04 + edgeNoise * 0.24)
  const edgeDensity = Math.min(1, Math.max(0.08, (x - edge + 2) / 4))
  const hidden = { backgroundColor: "transparent", transform: "scale(0)" }
  if (scatter > 0.78 * edgeDensity) return () => hidden
  const period = 3.8 + random(seed, x + 47, y + 73) * 4.4
  const breathPhase = random(seed, x + 131, y + 211) * Math.PI * 2
  const breathDepth = 0.65 + random(seed, x + 307, y + 419) * 0.35
  return (
    time: number | undefined,
    visibility: number,
    amplitude: number,
    _pointer: Point | null
  ) => {
    void _pointer
    if (visibility <= 0) return hidden
    const moving = time !== undefined && amplitude > 0
    const breath = moving
      ? (1 - Math.cos((time * Math.PI * 2) / period + breathPhase)) / 2
      : 0.5
    const reveal = Math.min(
      1,
      Math.max(0, (visibility - scatter) / (1 - scatter))
    )
    const size = (0.36 + (scatter / 0.78) * 0.22) * reveal
    const strength =
      (24 + (40 * x) / Math.max(1, columns)) *
      (0.9 + (breath - 0.5) * 0.7 * breathDepth * amplitude) *
      reveal *
      (0.65 + edgeDensity * 0.35)
    return {
      backgroundColor: `color-mix(in srgb, ${color} ${strength}%, transparent)`,
      transform: `translate(0px, 0px) scale(${size})`,
    }
  }
}

export function particleCell(
  color: string,
  seed: number,
  x: number,
  y: number,
  columns: number,
  time: number | undefined,
  visibility: number,
  amplitude: number,
  pointer: Point | null
) {
  return createParticleCell(
    color,
    seed,
    x,
    y,
    columns
  )(time, visibility, amplitude, pointer)
}
