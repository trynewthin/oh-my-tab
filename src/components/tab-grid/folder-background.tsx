import type { CSSProperties } from "react"
import "./folder-background.css"

export default function FolderBackground({
  color,
  animated = false,
}: {
  color: string
  animated?: boolean
}) {
  return (
    <div
      aria-hidden="true"
      data-animated={animated ? "true" : undefined}
      className="folder-glass pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
      style={{ "--folder-color": color } as CSSProperties}
    />
  )
}
