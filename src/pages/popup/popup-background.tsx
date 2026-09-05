import { useEffect, useState } from "react"
import {
  breathingWave,
  oceanCellColor,
} from "@/components/dot-matrix/breathing-wave"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

const COLUMNS = 26
const ROWS = 32

export default function PopupBackground() {
  const color = useHomeSettingsStore((state) => state.color)
  const [frame, setFrame] = useState(0)
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const timer = window.setInterval(() => {
      if (!document.hidden && !motion.matches) setFrame((value) => value + 1)
    }, 80)
    return () => window.clearInterval(timer)
  }, [])
  const pixels = breathingWave(COLUMNS, ROWS, frame)
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden bg-background"
    >
      <div
        className="absolute -inset-x-4 -top-4 grid gap-[2px]"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
      >
        {pixels.flatMap((row, y) =>
          row.map((value, x) => (
            <span
              key={y * COLUMNS + x}
              className="aspect-square rounded-[25%]"
              style={{ backgroundColor: oceanCellColor(value, color) }}
            />
          ))
        )}
      </div>
      <div className="absolute inset-0 bg-background/25 backdrop-blur-[2px]" />
    </div>
  )
}
