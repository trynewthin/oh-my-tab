import { createPortal } from "react-dom"
import { useGridSelectionStore } from "@/stores/grid-selection-store"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import EffectSurface from "./effect-surface"

const edges = [
  {
    id: "top",
    className:
      "absolute top-0 left-0 h-[100vw] w-16 origin-top-left translate-y-16 -rotate-90",
  },
  {
    id: "bottom",
    className:
      "absolute bottom-16 left-0 h-[100vw] w-16 origin-bottom-left rotate-90",
  },
  {
    id: "left",
    className: "absolute inset-y-0 left-0 w-16 rotate-180",
  },
  {
    id: "right",
    className: "absolute inset-y-0 right-0 w-16",
  },
]

export default function SelectionFlames() {
  const active = useGridSelectionStore((state) => state.active)
  const color = useHomeSettingsStore((state) => state.color)

  if (!active) return null
  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-40 overflow-hidden"
    >
      {edges.map((edge) => (
        <div
          key={edge.id}
          className={edge.className}
          style={{
            maskImage:
              "linear-gradient(to bottom, rgb(0 0 0 / 50%), black 64px, black calc(100% - 64px), rgb(0 0 0 / 50%))",
          }}
        >
          <EffectSurface
            color={color}
            textureId={`selection-edge-${edge.id}`}
            effectStyle="burning"
            coverage={65}
            animated
            entrance
            transparent
          />
        </div>
      ))}
    </div>,
    document.body
  )
}
