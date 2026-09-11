import { useEffect, useId, useRef, type CSSProperties } from "react"
import { mountPixiFolder } from "@/components/effects/pixi-folder"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import "./folder-background.css"

export default function FolderBackground({
  color,
  animated = false,
}: {
  color: string
  animated?: boolean
}) {
  const folderStyle = useHomeSettingsStore((state) => state.folderStyle)
  const backgroundType = useHomeSettingsStore((state) => state.backgroundType)
  const glass = backgroundType !== "solid"
  const ref = useRef<HTMLDivElement>(null)
  const noiseId = useId().replaceAll(":", "")
  useEffect(() => {
    if (folderStyle !== "classic" || !ref.current) return
    return mountPixiFolder(ref.current, color, animated)
  }, [folderStyle, color, animated])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-animated={animated ? "true" : undefined}
      className={`folder-glass folder-glass--${folderStyle} ${glass ? "folder-glass--blur" : ""} pointer-events-none absolute inset-0 z-0 rounded-[inherit]`}
      style={{ "--folder-color": color } as CSSProperties}
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
