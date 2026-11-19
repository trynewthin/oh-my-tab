import type { ReactNode } from "react"
import type { TabSize } from "@/lib/grid/types"
import type { TabAppearance } from "@/lib/tab-appearance"
import { useTabAppearance } from "./use-tab-style"
import "./tab-surface.css"

export default function TabSurface({
  children,
  appearance: appearanceOverride,
  size = "small",
  showShadow = false,
}: {
  children: ReactNode
  appearance?: TabAppearance
  size?: TabSize
  showShadow?: boolean
}) {
  const savedAppearance = useTabAppearance(size)
  const appearance = appearanceOverride ?? savedAppearance
  return (
    <div
      data-tab-surface
      data-tab-shadow={showShadow ? appearance.shadow : undefined}
      data-tab-shadow-size={showShadow ? size : undefined}
      className="absolute inset-0 isolate"
      style={{ borderRadius: appearance.radius }}
    >
      <div
        className="absolute inset-0 overflow-hidden rounded-[inherit]"
        style={{ contain: "size layout paint" }}
      >
        {children}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-20 rounded-[inherit]"
          style={{
            borderStyle: appearance.borderStyle,
            borderWidth: appearance.borderWidth,
            borderColor:
              appearance.borderColor === "theme"
                ? "var(--tile-border)"
                : appearance.borderColor,
            opacity: appearance.borderOpacity / 100,
          }}
        />
      </div>
    </div>
  )
}
