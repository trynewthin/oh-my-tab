import { useEffect, useMemo, useState } from "react"

import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { fitBitmap, textBitmap } from "./bitmap-font"
import { petBitmap } from "./pet-frames"

import { breathingWave, oceanCellColor } from "./breathing-wave"

const COLUMNS = 52
const ROWS = 7

export default function DotMatrix() {
  const content = useHomeSettingsStore((state) => state.content)
  const text = useHomeSettingsStore((state) => state.text)
  const color = useHomeSettingsStore((state) => state.color)
  const pet = useHomeSettingsStore((state) => state.pet)
  const [clock, setClock] = useState(() => new Date())
  const [frame, setFrame] = useState(0)
  const textPixels = useMemo(() => textBitmap(text), [text])

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const timer = window.setInterval(
      () => {
        if (document.hidden) return
        if (content === "time") setClock(new Date())
        else if (!motion.matches) setFrame((value) => value + 1)
      },
      content === "time"
        ? 1000
        : content === "pet"
          ? 220
          : content === "breathing"
            ? 80
            : 140
    )
    return () => window.clearInterval(timer)
  }, [content])

  const time = clock.toLocaleTimeString("en-GB", { hour12: false })
  const pixels =
    content === "time"
      ? fitBitmap(textBitmap(time), COLUMNS)
      : content === "pet"
        ? petBitmap(pet, COLUMNS, frame)
        : content === "breathing"
          ? breathingWave(COLUMNS, ROWS, frame)
          : fitBitmap(textPixels, COLUMNS, frame)
  const label =
    content === "time"
      ? `时间 ${time}`
      : content === "text"
        ? text || "空白点阵"
        : content === "breathing"
          ? "呼吸海浪点阵"
          : pet === "cat"
            ? "点阵小猫"
            : "点阵小狗"

  return (
    <div role="img" aria-label={label} className="w-full">
      <div
        className="grid gap-[2px] sm:gap-[3px]"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, minmax(0, 1fr))` }}
        aria-hidden="true"
      >
        {Array.from({ length: ROWS * COLUMNS }, (_, index) => (
          <span
            key={index}
            className="aspect-square min-w-0 rounded-[25%]"
            style={{
              backgroundColor:
                content === "breathing"
                  ? oceanCellColor(
                      pixels[Math.floor(index / COLUMNS)]?.[index % COLUMNS] ??
                        0,
                      color
                    )
                  : pixels[Math.floor(index / COLUMNS)]?.[index % COLUMNS]
                    ? color
                    : "var(--muted)",
            }}
          />
        ))}
      </div>
    </div>
  )
}
