import { useMemo } from "react"
import { createTabItem } from "@/lib/grid/factory"
import type { SquareTabSize } from "@/lib/grid/types"
import { DEFAULT_SQUARE_TAB_APPEARANCE } from "@/lib/tab-appearance"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import AppearancePreviewStage from "./appearance-preview-stage"
import AppearancePreviewTile from "./appearance-preview-tile"
import TabAppearanceControls from "./tab-appearance-controls"
import TabBackgroundControls from "./tab-background-controls"

const previewTiles = [
  { size: "square-large", className: "top-[9%] left-[7%] -rotate-4" },
  {
    size: "square-medium",
    className: "top-[29%] left-[max(51%,11.5rem)] rotate-2",
  },
  {
    size: "square-small",
    className: "top-[70%] left-[max(45%,9.75rem)] rotate-6",
  },
] satisfies { size: SquareTabSize; className: string }[]

export default function SquareTabsPane() {
  const color = useHomeSettingsStore((state) => state.color)
  const animated = useHomeSettingsStore((state) => state.newTabsDynamicEffect)
  const appearance = useHomeSettingsStore((state) => state.squareTabAppearance)
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
  const samples = useMemo(
    () =>
      previewTiles.map(({ size, className }) => ({
        className,
        item: {
          ...createTabItem({
            name: "Oh My Tab",
            url: "https://oh-my-tab.example",
          }),
          size,
          icon: `${import.meta.env.BASE_URL}icons/mark-128.png`,
        },
      })),
    []
  )

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
        <AppearancePreviewStage>
          {samples.map(({ item, className }) => (
            <AppearancePreviewTile
              key={item.id}
              item={{ ...item, color, dynamicEffect: animated }}
              className={className}
            />
          ))}
        </AppearancePreviewStage>
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
