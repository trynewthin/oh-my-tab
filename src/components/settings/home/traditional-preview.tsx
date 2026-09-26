import {
  ArrowUp,
  CaretDown,
  GearSix,
  MagnifyingGlass,
  SquaresFour,
} from "@phosphor-icons/react"
import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { fitBitmap, textBitmap } from "@/components/dot-matrix/bitmap-font"
import {
  breathingWave,
  oceanCellColor,
} from "@/components/dot-matrix/breathing-wave"
import { petBitmap } from "@/components/dot-matrix/pet-frames"
import {
  CELL_GAP,
  CELL_SIZE,
  clockBitmap,
  matrixColumns,
} from "@/components/dot-matrix/responsive-layout"
import { Button } from "@/components/ui/button"
import EngineIcon from "@/components/search/engine-icon"
import { searchEngineLabel } from "@/lib/search-engines"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { useSearchEngineStore } from "@/stores/search-engine-store"

// Compose at the home track's 768px maximum and scale the entire composition.
// Scaling individual cells or controls would distort their relative sizes.
const TRACK_WIDTH = 768
const FRAME_WIDTH = TRACK_WIDTH + 48
const COLUMNS = matrixColumns(TRACK_WIDTH)

export default function TraditionalPreview() {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(0)
  const [height, setHeight] = useState(0)
  const [now] = useState(() => new Date())
  const topComponent = useHomeSettingsStore((state) => state.topComponent)
  const content = useHomeSettingsStore((state) => state.content)
  const text = useHomeSettingsStore((state) => state.text)
  const pet = useHomeSettingsStore((state) => state.pet)
  const color = useHomeSettingsStore((state) => state.color)
  const searchBoxStyle = useHomeSettingsStore((state) => state.searchBoxStyle)
  const engines = useSearchEngineStore((state) => state.engines)
  const selectedId = useSearchEngineStore((state) => state.selectedId)
  const selectedEngine = engines.find((engine) => engine.id === selectedId)
  const engineName = selectedEngine
    ? searchEngineLabel(selectedEngine, (key) => t(key))
    : t("shell.engineSelect.browserDefault")

  useLayoutEffect(() => {
    const element = container.current
    const preview = contentRef.current
    if (!element || !preview) return
    const update = () => {
      setScale(Math.min(1, element.clientWidth / FRAME_WIDTH))
      setHeight(preview.offsetHeight)
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(element)
    observer.observe(preview)
    return () => observer.disconnect()
  }, [])

  const pixels = useMemo(() => {
    if (content === "time")
      return clockBitmap(
        now.toLocaleTimeString("en-GB", { hour12: false }),
        COLUMNS
      ).pixels
    if (content === "pet") return petBitmap(pet, COLUMNS, 0)
    if (content === "breathing") return breathingWave(COLUMNS, 7, 0)
    return fitBitmap(textBitmap(text), COLUMNS)
  }, [content, now, pet, text])

  return (
    <div
      ref={container}
      data-traditional-preview
      role="group"
      aria-label={t("settings.home.traditionalPreview")}
      className="w-full overflow-hidden rounded-2xl bg-card shadow-[0_0_14px_rgba(0,0,0,0.14)] dark:shadow-[0_0_18px_rgba(0,0,0,0.4)]"
      style={{ height: height * scale }}
    >
      <div
        ref={contentRef}
        aria-hidden="true"
        className="pointer-events-none origin-top-left px-6 pt-6 pb-6"
        style={{ width: FRAME_WIDTH, transform: `scale(${scale})` }}
      >
        {topComponent === "dot-matrix" && (
          <div className="flex min-h-[102px] items-start justify-center">
            <div
              className="grid w-fit"
              style={{
                gridTemplateColumns: `repeat(${COLUMNS}, ${CELL_SIZE}px)`,
                gap: CELL_GAP,
              }}
            >
              {pixels.flatMap((row, y) =>
                row.map((value, x) => (
                  <span
                    key={`${x}-${y}`}
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
        )}
        <div
          className={topComponent === "dot-matrix" ? "mt-6" : undefined}
          style={{ width: TRACK_WIDTH }}
        >
          {searchBoxStyle === "minimal" ? (
            <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-x-2">
              <div className="flex shrink-0 items-center gap-2 text-foreground">
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className="size-10 rounded-full border-border bg-card/70 bg-clip-padding backdrop-blur-xl"
                >
                  <SquaresFour className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className="size-10 rounded-full border-border bg-card/70 bg-clip-padding backdrop-blur-xl"
                >
                  <GearSix className="size-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className="size-10 rounded-full border-border bg-card/70 bg-clip-padding backdrop-blur-xl"
                >
                  <EngineIcon icon={selectedEngine?.icon} size={20} />
                </Button>
              </div>
              <div className="flex h-10 min-w-0 flex-1 items-center overflow-hidden rounded-full border border-border bg-background bg-clip-padding dark:bg-card">
                <span className="min-w-0 flex-1 px-4 text-sm text-muted-foreground">
                  {t("shell.home.searchPlaceholder")}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  tabIndex={-1}
                  className="mr-1 rounded-full text-muted-foreground"
                >
                  <MagnifyingGlass />
                </Button>
              </div>
            </div>
          ) : (
            <div className="rounded-3xl border border-input bg-background p-2 shadow-xs dark:bg-card">
              <div className="flex min-h-11 items-start px-3 py-2 text-sm text-muted-foreground">
                {t("shell.home.searchPlaceholder")}
              </div>
              <div className="flex items-center justify-end gap-1 px-2 pt-1 pb-1 text-foreground sm:gap-2">
                <Button variant="ghost" size="icon" tabIndex={-1}>
                  <SquaresFour className="size-5" />
                </Button>
                <div className="mr-auto">
                  <Button variant="ghost" size="icon" tabIndex={-1}>
                    <GearSix className="size-5" />
                  </Button>
                </div>
                <Button variant="ghost" tabIndex={-1}>
                  <EngineIcon icon={selectedEngine?.icon} />
                  <span className="max-w-32 truncate">{engineName}</span>
                  <CaretDown className="size-3 text-muted-foreground" />
                </Button>
                <Button
                  size="icon"
                  tabIndex={-1}
                  style={{ backgroundColor: color }}
                >
                  <ArrowUp />
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
