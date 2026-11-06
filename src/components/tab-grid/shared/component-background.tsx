import { useEffect, useId, useMemo, useRef, type CSSProperties } from "react"
import { resolveFolderGlow } from "@/lib/folder-glow"
import { mountPixiFolder } from "@/components/effects/pixi-folder"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import "./component-background.css"

export default function ComponentBackground({
  color,
  appearanceId,
  animated = false,
}: {
  color: string
  appearanceId?: string
  animated?: boolean
}) {
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const glass = backgroundType !== "solid"
  const ref = useRef<HTMLDivElement>(null)
  const noiseId = useId().replaceAll(":", "")
  const glowId = appearanceId ?? noiseId
  const glow = useMemo(() => resolveFolderGlow(glowId), [glowId])
  useEffect(() => {
    if (folderStyle !== "classic" || !ref.current) return
    return mountPixiFolder(ref.current, color, animated, glow)
  }, [folderStyle, color, animated, glow])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-animated={animated ? "true" : undefined}
      className={`folder-glass folder-glass--${folderStyle} ${glass ? "folder-glass--blur" : ""} pointer-events-none absolute inset-0 z-0 rounded-[inherit]`}
      style={
        {
          "--folder-color": color,
          "--glow-x": `${glow.x * 100}%`,
          "--glow-y": `${glow.y * 100}%`,
          "--glow-radius-x": `${glow.radiusX * 100}%`,
          "--glow-radius-y": `${glow.radiusY * 100}%`,
          "--glow-opacity": `${glow.opacity * 100}%`,
        } as CSSProperties
      }
    >
      {folderStyle === "noise" && (
        <>
          <div className="folder-noise-gradient" />
          <svg
            className="folder-noise-texture"
            width="100%"
            height="100%"
            preserveAspectRatio="none"
          >
            <filter id={noiseId}>
              <feTurbulence
                type="fractalNoise"
                baseFrequency="0.72"
                numOctaves="4"
                seed="8"
                stitchTiles="stitch"
              />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter={`url(#${noiseId})`} />
          </svg>
        </>
      )}
    </div>
  )
}
