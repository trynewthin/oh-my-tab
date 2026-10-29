import type { ReactNode } from "react"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import type { TabAppearance } from "@/lib/tab-appearance"

export default function TabSurface({
  children,
  appearance: appearanceOverride,
}: {
  children: ReactNode
  appearance?: TabAppearance
}) {
  const savedAppearance = useHomeSettingsStore((state) => state.tabAppearance)
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
