import { useEffect, useRef, type CSSProperties } from "react"
import { mountPixiFolder } from "@/components/effects/pixi-folder"
import "./folder-background.css"

export default function FolderBackground({
  color,
  animated = false,
}: {
  color: string
  animated?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) return mountPixiFolder(ref.current, color, animated)
  }, [color, animated])
  return (
    <div
      ref={ref}
      aria-hidden="true"
      data-animated={animated ? "true" : undefined}
      className="folder-glass pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
      style={{ "--folder-color": color } as CSSProperties}
    />
  )
}
