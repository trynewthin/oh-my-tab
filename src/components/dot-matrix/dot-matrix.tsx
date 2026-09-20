import PixiMatrix from "./pixi-matrix"
import { useMatrixRendererStore } from "@/stores/matrix-renderer-store"
import { fitBitmap, textBitmap } from "./bitmap-font"
import { matrixPets } from "@/lib/matrix-pets"
import { useEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { petBitmap } from "./pet-frames"
import { breathingWave, oceanCellColor } from "./breathing-wave"
import {
  CELL_SIZE,
  CELL_GAP,
  clockBitmap,
  matrixColumns,
} from "./responsive-layout"

function MatrixContent({
  columns,
  showSeconds,
}: {
  columns: number
  showSeconds: boolean
}) {
  const { t } = useTranslation()
  const renderer = useMatrixRendererStore((state) => state.renderer)
  const [failed, setFailed] = useState(false)
  const usePixi = renderer === "pixi" && !failed
  const content = useHomeSettingsStore((state) => state.content)
  const text = useHomeSettingsStore((state) => state.text)
  const color = useHomeSettingsStore((state) => state.color)
  const pet = useHomeSettingsStore((state) => state.pet)
  const [clock, setClock] = useState(() => new Date())
  const [frame, setFrame] = useState(0)
  const textPixels = useMemo(() => textBitmap(text), [text])

  useEffect(() => {
    if (content === "text" && (textPixels[0]?.length ?? 0) <= columns) return
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
  }, [content, columns, textPixels])

  const time = clock.toLocaleTimeString("en-GB", { hour12: false })
  const clockDisplay = clockBitmap(time, columns, showSeconds)
  const pixels =
    content === "time"
      ? clockDisplay.pixels
      : content === "pet"
        ? petBitmap(pet, columns, frame)
        : content === "breathing"
          ? breathingWave(columns, 7, frame)
          : fitBitmap(textPixels, columns, frame)
  const petLabel = matrixPets.find((item) => item.id === pet)?.labelKey
  const label =
    content === "time"
      ? t("shell.dotMatrix.time", { time })
      : content === "text"
        ? text || t("shell.dotMatrix.blank")
        : content === "breathing"
          ? t("shell.dotMatrix.breathing")
          : t("shell.dotMatrix.pet", { name: petLabel ? t(petLabel) : "" })
  return (
    <div className="w-full">
      <div
        role="img"
        aria-label={label}
        data-matrix-columns={columns}
        data-matrix-renderer={usePixi ? "pixi" : "dom"}
        data-time-format={content === "time" ? clockDisplay.format : undefined}
        className="mx-auto grid w-fit [contain:layout_paint_style]"
        style={{
          gridTemplateColumns: usePixi
            ? undefined
            : `repeat(${columns}, ${CELL_SIZE}px)`,
          gap: CELL_GAP,
        }}
      >
        {usePixi ? (
          <PixiMatrix
            pixels={pixels}
            color={color}
            ocean={content === "breathing"}
            onFailure={() => setFailed(true)}
          />
        ) : (
          pixels.flatMap((row, y) =>
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
          )
        )}
      </div>
    </div>
  )
}

export default function DotMatrix({
  showSeconds = true,
}: {
  showSeconds?: boolean
}) {
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
          showSeconds={showSeconds}
        />
      )}
    </div>
  )
}
