export function ItemGlow({
  color,
  opacity = 0.22,
}: {
  color: string
  opacity?: number
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 rounded-2xl"
      style={{
        background: color,
        opacity,
        filter: "blur(12px)",
      }}
    />
  )
}
