import { useMemo, useState, type CSSProperties } from "react"
import { CELL_GAP, CELL_SIZE, framedClockBitmap } from "./responsive-layout"
import PixiMatrix from "./pixi-matrix"
import { useMatrixRendererStore } from "@/stores/matrix-renderer-store"

/** Reuse the matrix glyphs and renderer with the same lit and unlit cells as the home header. */
export default function ClockDigits({
  text,
  color,
  stacked = false,
}: {
  text: string
  color: string
  stacked?: boolean
}) {
  const pixels = useMemo(
    () => framedClockBitmap(text, stacked),
    [text, stacked]
  )
  const renderer = useMatrixRendererStore((state) => state.renderer)
  const [failed, setFailed] = useState(false)
  const columns = pixels[0].length
  const width = columns * (CELL_SIZE + CELL_GAP) - CELL_GAP
  const height = pixels.length * (CELL_SIZE + CELL_GAP) - CELL_GAP
  return (
    <span
      className="utility-clock-matrix"
      aria-hidden="true"
      style={
        {
          aspectRatio: `${width} / ${height}`,
          "--clock-matrix-ratio": width / height,
        } as CSSProperties
      }
    >
      {renderer === "pixi" && !failed ? (
        <PixiMatrix
          pixels={pixels}
          color={color}
          ocean={false}
          onFailure={() => setFailed(true)}
        />
      ) : (
        <svg viewBox={`0 0 ${width} ${height}`} fill={color}>
          {pixels.flatMap((row, y) =>
            row.map((value, x) => (
              <rect
                key={`${x}-${y}`}
                x={x * (CELL_SIZE + CELL_GAP)}
                y={y * (CELL_SIZE + CELL_GAP)}
                width={CELL_SIZE}
                height={CELL_SIZE}
                rx={3}
                fill={value ? color : "var(--muted)"}
              />
            ))
          )}
        </svg>
      )}
    </span>
  )
}
