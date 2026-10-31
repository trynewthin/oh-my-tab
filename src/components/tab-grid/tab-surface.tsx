import type { ReactNode } from "react"
import type { TabSize } from "@/lib/grid/types"
import type { TabAppearance } from "@/lib/tab-appearance"
import { useTabAppearance } from "./use-tab-style"

export default function TabSurface({
  children,
  appearance: appearanceOverride,
  size = "small",
}: {
  children: ReactNode
  appearance?: TabAppearance
  size?: TabSize
}) {
  const savedAppearance = useTabAppearance(size)
  const appearance = appearanceOverride ?? savedAppearance
  return (
    <div
      data-tab-surface
      className="absolute inset-0 isolate overflow-hidden"
      style={{ borderRadius: appearance.radius, contain: "size layout paint" }}
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
  )
}
