import { useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { createTabItem } from "@/lib/grid/factory"
import ScaledGridPreview from "./scaled-grid-preview"
import TabAppearanceControls from "./tab-appearance-controls"
import TabBackgroundControls from "./tab-background-controls"
import type { GridItem, TabItem } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

const appIcon = `${import.meta.env.BASE_URL}icons/icon-128.png`

function previewTab(
  name: string,
  size: "small" | "medium",
  dynamicEffect: boolean
): TabItem {
  return {
    ...createTabItem({
      name,
      url: "https://oh-my-tab.example",
      dynamicEffect,
    }),
    size,
    icon: appIcon,
  }
}

// 4x2 tab on the left, two 4x1 tabs stacked right, centered under the select row.
function buildPreview(t: (key: string) => string, dynamicEffect: boolean) {
  const [medium, smallA, smallB] = [
    previewTab("Oh My Tab", "medium", dynamicEffect),
    previewTab(t("settings.previews.newTab"), "small", dynamicEffect),
    previewTab(t("settings.previews.extensions"), "small", dynamicEffect),
  ]
  return {
    items: [medium, smallA, smallB] satisfies GridItem[],
    area: { columns: 8, rows: 2 },
    positions: {
      [medium.id]: { x: 0, y: 0 },
      [smallA.id]: { x: 4, y: 0 },
      [smallB.id]: { x: 4, y: 1 },
    },
  }
}

function homeGridTrackWidth() {
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

export default function TabsPane() {
  const { t } = useTranslation()
  const tabTexture = useHomeSettingsStore((state) => state.tabTexture)
  const setTabTexture = useHomeSettingsStore((state) => state.setTabTexture)
  const tabEffectCoverage = useHomeSettingsStore(
    (state) => state.tabEffectCoverage
  )
  const setTabEffectCoverage = useHomeSettingsStore(
    (state) => state.setTabEffectCoverage
  )
  const newTabsDynamicEffect = useHomeSettingsStore(
    (state) => state.newTabsDynamicEffect
  )
  const appearance = useHomeSettingsStore((state) => state.tabAppearance)
  const setAppearance = useHomeSettingsStore((state) => state.setTabAppearance)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)
  const preview = useMemo(
    () => buildPreview(t, newTabsDynamicEffect),
    [newTabsDynamicEffect, t]
  )

  useLayoutEffect(() => {
    const measure = () => setTrackWidth(homeGridTrackWidth())
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <>
      <TabAppearanceControls
        value={appearance}
        onChange={setAppearance}
        preview={
          <div className="space-y-2">
            <header className="space-y-1">
              <h2 className="text-base font-medium">
                {t("settings.nav.tabsStrip")}
              </h2>
            </header>
            {trackWidth > 0 && (
              <ScaledGridPreview
                items={preview.items}
                trackWidth={trackWidth}
                area={preview.area}
                positions={preview.positions}
              />
            )}
          </div>
        }
        onResetBackground={() => {
          const defaults = useHomeSettingsStore.getInitialState()
          setTabTexture(defaults.tabTexture)
          setTabEffectCoverage(defaults.tabEffectCoverage)
        }}
        backgroundControls={
          <TabBackgroundControls
            texture={tabTexture}
            coverage={tabEffectCoverage}
            onTextureChange={setTabTexture}
            onCoverageChange={setTabEffectCoverage}
          />
        }
      />
    </>
  )
}
