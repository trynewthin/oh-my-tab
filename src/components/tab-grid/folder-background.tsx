import type { CSSProperties } from "react"
import "./folder-background.css"

export default function FolderBackground({ color }: { color: string }) {
  return (
    <div
      aria-hidden="true"
      className="folder-glass pointer-events-none absolute inset-0 z-0 rounded-[inherit]"
      style={{ "--folder-color": color } as CSSProperties}
    />
  )
}
