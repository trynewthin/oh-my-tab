import { useHomeSettingsStore } from "@/stores/home-settings-store"

export default function FolderBorder() {
  const border = useHomeSettingsStore((state) => state.folderBorder)
  const radius = useHomeSettingsStore((state) => state.tabAppearance.radius)
  return (
    <div
      aria-hidden="true"
      data-folder-border
      className="pointer-events-none absolute inset-0 z-30"
      style={{
        borderRadius: radius,
        borderStyle: border.style,
        borderWidth: border.width,
        borderColor:
          border.color === "theme" ? "var(--tile-border)" : border.color,
        opacity: border.opacity / 100,
      }}
    />
  )
}
