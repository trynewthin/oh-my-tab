import type { DisplacementImage } from "./use-glass-displacement"

export function LiquidGlassRefraction({
  id,
  image,
  blur,
  strength,
}: {
  id: string
  image: DisplacementImage
  blur: number
  strength: number
}) {
  const maxScale = Math.min(80, Math.min(image.width, image.height) * 1.35)

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute size-0">
      <defs>
        <filter
          id={id}
          x="0%"
          y="0%"
          width="100%"
          height="100%"
          colorInterpolationFilters="sRGB"
        >
          <feGaussianBlur
            in="SourceGraphic"
            stdDeviation={blur}
            edgeMode="duplicate"
            result="glass-center"
          />
          <feImage
            href={image.href}
            x="0"
            y="0"
            width={image.width}
            height={image.height}
            preserveAspectRatio="none"
            result="glass-map"
          />
          <feDisplacementMap
            in="SourceGraphic"
            in2="glass-map"
            scale={maxScale * (strength / 100)}
            xChannelSelector="R"
            yChannelSelector="G"
            result="glass-bent"
          />
          <feGaussianBlur
            in="glass-bent"
            stdDeviation={blur * 0.18}
            edgeMode="duplicate"
            result="glass-rim"
          />
          <feColorMatrix
            in="glass-map"
            type="matrix"
            values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 1 0 0"
            result="glass-rim-mask"
          />
          <feComposite
            in="glass-rim"
            in2="glass-rim-mask"
            operator="in"
            result="glass-edge"
          />
          <feMerge>
            <feMergeNode in="glass-center" />
            <feMergeNode in="glass-edge" />
          </feMerge>
        </filter>
      </defs>
    </svg>
  )
}
