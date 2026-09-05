function currentHue(color: string): number | null {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return null
  const [r, g, b] = [1, 3, 5].map(
    (offset) => parseInt(color.slice(offset, offset + 2), 16) / 255
  )
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  if (!delta) return null
  const hue =
    max === r
      ? (g - b) / delta
      : max === g
        ? (b - r) / delta + 2
        : (r - g) / delta + 4
  return (hue * 60 + 360) % 360
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const amplitude = saturation * Math.min(lightness, 1 - lightness)
  const channel = (offset: number) => {
    const k = (offset + hue / 30) % 12
    const value =
      lightness - amplitude * Math.max(-1, Math.min(k - 3, 9 - k, 1))
    return Math.round(value * 255)
      .toString(16)
      .padStart(2, "0")
  }
  return `#${channel(0)}${channel(8)}${channel(4)}`
}

export function randomFolderColor(current: string): string {
  const previousHue = currentHue(current)
  const hue =
    previousHue === null
      ? Math.random() * 360
      : (previousHue + 50 + Math.random() * 260) % 360
  const saturation = 0.4 + Math.random() * 0.35
  const lightness = 0.45 + Math.random() * 0.23
  return hslToHex(hue, saturation, lightness)
}
