import { useLayoutEffect, useMemo, useRef, useState } from "react"
import { useTranslation } from "react-i18next"
import TabUI from "@/components/tab-grid/tab-ui"
import TabSurface from "@/components/tab-grid/tab-surface"
import TabBackground from "@/components/tab-grid/tab-background"
import { createTabItem } from "@/lib/grid/factory"
import { DEFAULT_SQUARE_TAB_APPEARANCE } from "@/lib/tab-appearance"
import {
  GRID_CELL_SIZE,
  GRID_GAP,
  gridTrackWidth,
} from "@/lib/grid/grid-layout"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import TabAppearanceControls from "./tab-appearance-controls"
import TabBackgroundControls from "./tab-background-controls"
const previewTiles = [
  { size: 4, column: 1, row: 1 },
  { size: 1, column: 5, row: 1 },
  { size: 1, column: 6, row: 1 },
  { size: 1, column: 5, row: 2 },
  { size: 1, column: 6, row: 2 },
  { size: 2, column: 5, row: 3 },
] as const
const previewWidth = gridTrackWidth(6)
const previewHeight = gridTrackWidth(4)
const previewReferenceWidth = gridTrackWidth(8)

export default function SquareTabsPane() {
  const { t } = useTranslation()
  const color = useHomeSettingsStore((state) => state.color)
  const animated = useHomeSettingsStore((state) => state.newTabsDynamicEffect)
  const appearance = useHomeSettingsStore((state) => state.squareTabAppearance)
  const iconAppearance = { ...appearance, display: "icon" as const }
  const setAppearance = useHomeSettingsStore(
    (state) => state.setSquareTabAppearance
  )
  const texture = useHomeSettingsStore((state) => state.squareTabTexture)
  const setTexture = useHomeSettingsStore((state) => state.setSquareTabTexture)
  const coverage = useHomeSettingsStore(
    (state) => state.squareTabEffectCoverage
  )
  const setCoverage = useHomeSettingsStore(
    (state) => state.setSquareTabEffectCoverage
  )
  const item = useMemo(
    () => ({
      ...createTabItem({ name: "Oh My Tab", url: "https://oh-my-tab.example" }),
      icon: `${import.meta.env.BASE_URL}icons/icon-128.png`,
      color,
    }),
    [color]
  )
  const previewRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(448 / previewReferenceWidth)
  useLayoutEffect(() => {
    const container = previewRef.current
    if (!container) return
    const update = () =>
      setScale(
        Math.min(
          1,
          Math.min(container.clientWidth, 448) / previewReferenceWidth
        )
      )
    update()
    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])
  return (
    <TabAppearanceControls
      value={appearance}
      defaults={DEFAULT_SQUARE_TAB_APPEARANCE}
      onChange={setAppearance}
      onResetBackground={() => {
        const defaults = useHomeSettingsStore.getInitialState()
        setTexture(defaults.squareTabTexture)
        setCoverage(defaults.squareTabEffectCoverage)
      }}
      preview={
        <div className="space-y-3">
          <h2 className="text-base font-medium">
            {t("settings.nav.tabsSquare")}
          </h2>
          <div
            ref={previewRef}
            aria-label={t("settings.tabs.squareDescription")}
            className="w-full"
          >
            <div
              className="relative mx-auto"
              style={{
                width: previewWidth * scale,
                height: previewHeight * scale,
              }}
            >
              <div
                className="absolute top-0 left-0 grid"
                style={{
                  width: previewWidth,
                  height: previewHeight,
                  gridTemplateColumns: `repeat(6, ${GRID_CELL_SIZE}px)`,
                  gridTemplateRows: `repeat(4, ${GRID_CELL_SIZE}px)`,
                  gap: GRID_GAP,
                  transform: `scale(${scale})`,
                  transformOrigin: "top left",
                }}
              >
                {previewTiles.map(({ size, column, row }) => (
                  <div
                    key={`${column}-${row}`}
                    data-square-tab-preview={size}
                    aria-label={`${size}×${size}`}
                    className="relative shrink-0"
                    style={{
                      gridColumn: `${column} / span ${size}`,
                      gridRow: `${row} / span ${size}`,
                    }}
                  >
                    <TabSurface appearance={appearance}>
                      <TabBackground
                        item={item}
                        textureId={`${item.id}-${column}-${row}`}
                        appearance={appearance}
                        effectStyle={texture}
                        coverage={coverage}
                        animated={animated}
                      />
                      <TabUI
                        item={item}
                        appearance={size === 1 ? iconAppearance : appearance}
                        iconBaseSize={size === 4 ? 64 : undefined}
                        preview
                      />
                    </TabSurface>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      }
      backgroundControls={
        <TabBackgroundControls
          texture={texture}
          coverage={coverage}
          onTextureChange={setTexture}
          onCoverageChange={setCoverage}
        />
      }
    />
  )
}
