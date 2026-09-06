import { fitBitmap, textBitmap } from "./bitmap-font"
import { matrixPets } from "./pet-catalog"
import { useEffect, useMemo, useRef, useState } from "react"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { petBitmap } from "./pet-frames"
import { breathingWave, oceanCellColor } from "./breathing-wave"
import {
  CELL_SIZE,
  CELL_GAP,
  clockBitmap,
  matrixColumns,
} from "./responsive-layout"

function MatrixContent({ columns }: { columns: number }) {
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
        : content === "text"
          ? 140
          : content === "pet"
            ? 220
            : 80
    )
    return () => window.clearInterval(timer)
  }, [content])

  const time = clock.toLocaleTimeString("en-GB", { hour12: false })
  const clockDisplay = clockBitmap(time, columns)
  const pixels =
    content === "time"
      ? clockDisplay.pixels
      : content === "pet"
        ? petBitmap(pet, columns, frame)
        : content === "breathing"
          ? breathingWave(columns, 7, frame)
          : fitBitmap(textPixels, columns, frame)
  const label =
    content === "time"
      ? `时间 ${time}`
      : content === "text"
        ? text || "空白点阵"
        : content === "breathing"
          ? "呼吸海浪点阵"
          : `颜文字宠物 ${matrixPets.find((item) => item.id === pet)?.label}`
  return (
    <div className="w-full">
      <div
        role="img"
        aria-label={label}
        data-matrix-columns={columns}
        data-time-format={content === "time" ? clockDisplay.format : undefined}
        className="mx-auto grid w-fit"
        style={{
          gridTemplateColumns: `repeat(${columns}, ${CELL_SIZE}px)`,
          gap: CELL_GAP,
        }}
      >
        {pixels.flatMap((row, y) =>
          row.map((value, x) => (
            <span
              key={`${x}-${y}`}
              aria-hidden="true"
              className="rounded-[25%]"
              style={{
                width: CELL_SIZE,
                height: CELL_SIZE,
                backgroundColor:
                  content === "breathing"
                    ? oceanCellColor(value, color)
                    : value
                      ? color
                      : "var(--muted)",
              }}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function DotMatrix() {
  const container = useRef<HTMLDivElement>(null)
  const [columns, setColumns] = useState(0)
  const content = useHomeSettingsStore((state) => state.content)
  const text = useHomeSettingsStore((state) => state.text)
  useEffect(() => {
    const element = container.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setColumns(matrixColumns(entry.contentRect.width))
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  return (
    <div ref={container} className="min-h-[102px] w-full">
      {columns > 0 && (
        <MatrixContent
          key={`${columns}-${content}-${text}`}
          columns={columns}
        />
      )}
    </div>
  )
}
