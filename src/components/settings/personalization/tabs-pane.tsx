import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { createTabItem } from "@/lib/grid/factory"
import AppearancePreviewStage from "./appearance-preview-stage"
import AppearancePreviewTile from "./appearance-preview-tile"
import TabAppearanceControls from "./tab-appearance-controls"
import TabBackgroundControls from "./tab-background-controls"
import type { TabItem } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"

const appIcon = `${import.meta.env.BASE_URL}icons/mark-128.png`

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
  const [medium, newTab, extensions] = useMemo(
    () => [
      previewTab("Oh My Tab", "medium", newTabsDynamicEffect),
      previewTab(t("settings.previews.newTab"), "small", newTabsDynamicEffect),
      previewTab(
        t("settings.previews.extensions"),
        "small",
        newTabsDynamicEffect
      ),
    ],
    [newTabsDynamicEffect, t]
  )

  return (
    <>
      <TabAppearanceControls
        value={appearance}
        onChange={setAppearance}
        preview={
          <AppearancePreviewStage>
            <AppearancePreviewTile
              item={medium}
              className="top-[14%] left-[8%] -rotate-4"
            />
            <AppearancePreviewTile
              item={newTab}
              className="top-[51%] left-[25%] -rotate-1"
            />
            <AppearancePreviewTile
              item={extensions}
              className="top-[76%] left-[38%] rotate-3"
            />
          </AppearancePreviewStage>
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
