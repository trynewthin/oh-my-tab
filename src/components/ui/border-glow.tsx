import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react"

type BorderGlowProps = {
  children?: ReactNode
  className?: string
  edgeSensitivity?: number
  glowColor?: string
  backgroundColor?: string
  borderRadius?: number
  glowRadius?: number
  glowIntensity?: number
  coneSpread?: number
  animated?: boolean
  colors?: string[]
  fillOpacity?: number
}

const gradientPositions = [
  "80% 55%",
  "69% 34%",
  "8% 6%",
  "41% 38%",
  "86% 85%",
  "82% 18%",
  "51% 4%",
]
const colorMap = [0, 1, 2, 0, 1, 2, 1]

function parseHsl(value: string) {
  const match = value.match(/([\d.]+)\s*([\d.]+)%?\s*([\d.]+)%?/)
  if (!match) return { h: 270, s: 90, l: 75 }
  return {
    h: Number.parseFloat(match[1]),
    s: Number.parseFloat(match[2]),
    l: Number.parseFloat(match[3]),
  }
}

function buildBoxShadow(glowColor: string, intensity: number) {
  const { h, s, l } = parseHsl(glowColor)
  const color = `${h}deg ${s}% ${l}%`
  const layers: [number, number, number, boolean][] = [
    [0, 1, 100, true],
    [1, 0, 60, true],
    [3, 0, 50, true],
    [6, 0, 40, true],
    [15, 0, 30, true],
    [25, 2, 20, true],
    [50, 2, 10, true],
    [1, 0, 60, false],
    [3, 0, 50, false],
    [6, 0, 40, false],
    [15, 0, 30, false],
    [25, 2, 20, false],
    [50, 2, 10, false],
  ]
  return layers
    .map(([blur, spread, alpha, inset]) => {
      const opacity = Math.min(alpha * intensity, 100)
      return `${inset ? "inset " : ""}0 0 ${blur}px ${spread}px hsl(${color} / ${opacity}%)`
    })
    .join(", ")
}

function buildMeshGradients(colors: string[]) {
  return gradientPositions.map((position, index) => {
    const color = colors[Math.min(colorMap[index], colors.length - 1)]
    return `radial-gradient(at ${position}, ${color} 0px, transparent 50%)`
  })
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3)
}

function easeInCubic(value: number) {
  return value * value * value
}

export default function BorderGlow({
  children,
  className = "",
  edgeSensitivity = 30,
  glowColor = "270 90 75",
  backgroundColor = "var(--card)",
  borderRadius = 24,
  glowRadius = 36,
  glowIntensity = 0.8,
  coneSpread = 25,
  animated = false,
  colors = ["#c084fc", "#f472b6", "#38bdf8"],
  fillOpacity = 0.42,
}: BorderGlowProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const [cursorAngle, setCursorAngle] = useState(45)
  const [edgeProximity, setEdgeProximity] = useState(0)
  const [sweepActive, setSweepActive] = useState(false)

  const handlePointerMove = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      const card = cardRef.current
      if (!card) return
      const rect = card.getBoundingClientRect()
      const x = event.clientX - rect.left
      const y = event.clientY - rect.top
      const centerX = rect.width / 2
      const centerY = rect.height / 2
      const deltaX = x - centerX
      const deltaY = y - centerY
      const scaleX = deltaX === 0 ? Infinity : centerX / Math.abs(deltaX)
      const scaleY = deltaY === 0 ? Infinity : centerY / Math.abs(deltaY)
      setEdgeProximity(Math.min(Math.max(1 / Math.min(scaleX, scaleY), 0), 1))
      const degrees = Math.atan2(deltaY, deltaX) * (180 / Math.PI) + 90
      setCursorAngle(degrees < 0 ? degrees + 360 : degrees)
    },
    []
  )

  useEffect(() => {
    if (
      !animated ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return
    let frame = 0
    const startedAt = performance.now()
    const duration = 4000
    const tick = () => {
      const progress = Math.min((performance.now() - startedAt) / duration, 1)
      setSweepActive(progress < 1)
      setCursorAngle(110 + 355 * easeOutCubic(progress))
      setEdgeProximity(
        progress < 0.125
          ? easeOutCubic(progress / 0.125)
          : progress < 0.625
            ? 1
            : 1 - easeInCubic((progress - 0.625) / 0.375)
      )
      if (progress < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [animated])

  const colorSensitivity = edgeSensitivity + 20
  const visible = hovered || sweepActive
  const borderOpacity = visible
    ? Math.max(
        0,
        (edgeProximity * 100 - colorSensitivity) / (100 - colorSensitivity)
      )
    : 0
  const glowOpacity = visible
    ? Math.max(
        0,
        (edgeProximity * 100 - edgeSensitivity) / (100 - edgeSensitivity)
      )
    : 0
  const meshGradients = buildMeshGradients(colors)
  const borderBackground = meshGradients.map(
    (gradient) => `${gradient} border-box`
  )
  const fillBackground = meshGradients.map(
    (gradient) => `${gradient} padding-box`
  )
  const angle = `${cursorAngle.toFixed(3)}deg`
  const transition = visible
    ? "opacity 0.25s ease-out"
    : "opacity 0.75s ease-in-out"

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      className={`relative isolate grid border ${className}`}
      style={{
        background: backgroundColor,
        borderColor: "color-mix(in srgb, var(--foreground) 15%, transparent)",
        borderRadius,
        transform: "translate3d(0, 0, 0.01px)",
        boxShadow: "rgb(0 0 0 / 10%) 0 2px 4px, rgb(0 0 0 / 14%) 0 16px 40px",
      }}
    >
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-1 rounded-[inherit]"
        style={{
          border: "1px solid transparent",
          background: [
            `linear-gradient(${backgroundColor} 0 100%) padding-box`,
            "linear-gradient(rgb(255 255 255 / 0%) 0 100%) border-box",
            ...borderBackground,
          ].join(", "),
          opacity: borderOpacity,
          maskImage: `conic-gradient(from ${angle} at center, black ${coneSpread}%, transparent ${coneSpread + 15}%, transparent ${100 - coneSpread - 15}%, black ${100 - coneSpread}%)`,
          transition,
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-1 rounded-[inherit]"
        style={
          {
            border: "1px solid transparent",
            background: fillBackground.join(", "),
            maskImage: [
              "linear-gradient(to bottom, black, black)",
              "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
              "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
              "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
              "radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)",
              "radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)",
              `conic-gradient(from ${angle} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
            ].join(", "),
            WebkitMaskImage: [
              "linear-gradient(to bottom, black, black)",
              "radial-gradient(ellipse at 50% 50%, black 40%, transparent 65%)",
              "radial-gradient(ellipse at 66% 66%, black 5%, transparent 40%)",
              "radial-gradient(ellipse at 33% 33%, black 5%, transparent 40%)",
              "radial-gradient(ellipse at 66% 33%, black 5%, transparent 40%)",
              "radial-gradient(ellipse at 33% 66%, black 5%, transparent 40%)",
              `conic-gradient(from ${angle} at center, transparent 5%, black 15%, black 85%, transparent 95%)`,
            ].join(", "),
            maskComposite: "subtract, add, add, add, add, add",
            WebkitMaskComposite:
              "source-out, source-over, source-over, source-over, source-over, source-over",
            opacity: borderOpacity * fillOpacity,
            mixBlendMode: "soft-light",
            transition,
          } as CSSProperties
        }
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute z-1 rounded-[inherit]"
        style={{
          inset: -glowRadius,
          maskImage: `conic-gradient(from ${angle} at center, black 2.5%, transparent 10%, transparent 90%, black 97.5%)`,
          opacity: glowOpacity,
          mixBlendMode: "normal",
          transition,
        }}
      >
        <span
          className="absolute rounded-[inherit]"
          style={{
            inset: glowRadius,
            boxShadow: buildBoxShadow(glowColor, glowIntensity),
          }}
        />
      </span>
      <div className="relative z-1 flex flex-col overflow-hidden rounded-[inherit]">
        {children}
      </div>
    </div>
  )
}
