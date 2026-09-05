import { useAppearanceStore } from "@/stores/appearance-store"

export default function HomeBackground() {
  const backgroundColor = useAppearanceStore((state) => state.backgroundColor)

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0"
      style={{
        backgroundColor:
          backgroundColor === "#ffffff" ? "var(--background)" : backgroundColor,
      }}
    />
  )
}
