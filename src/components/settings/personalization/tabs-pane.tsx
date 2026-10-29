import { useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { createTabItem } from "@/lib/grid/factory"
import EffectStylePicker from "./effect-style-picker"
import ScaledGridPreview from "./scaled-grid-preview"
import TabAppearanceControls from "./tab-appearance-controls"
import { Switch } from "@/components/ui/switch"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { GridItem, TabItem } from "@/lib/grid/types"
import {
  MAX_TAB_EFFECT_COVERAGE,
  MIN_TAB_EFFECT_COVERAGE,
  useHomeSettingsStore,
} from "@/stores/home-settings-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"
import SettingRange from "../shared/setting-range"

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
  const color = useHomeSettingsStore((state) => state.color)
  const newTabsDynamicEffect = useHomeSettingsStore(
    (state) => state.newTabsDynamicEffect
  )
  const setNewTabsDynamicEffect = useHomeSettingsStore(
    (state) => state.setNewTabsDynamicEffect
  )
  const setAllTabDynamicEffects = useTabGridStore(
    (state) => state.setAllTabDynamicEffects
  )
  const [applyExisting, setApplyExisting] = useState<boolean | null>(null)
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
        preview={
          trackWidth > 0 ? (
            <ScaledGridPreview
              items={preview.items}
              trackWidth={trackWidth}
              area={preview.area}
              positions={preview.positions}
            />
          ) : null
        }
        onResetBackground={() => {
          const defaults = useHomeSettingsStore.getInitialState()
          setTabTexture(defaults.tabTexture)
          setTabEffectCoverage(defaults.tabEffectCoverage)
          setNewTabsDynamicEffect(defaults.newTabsDynamicEffect)
        }}
        backgroundControls={
          <>
            <SettingItem
              label={t("settings.tabs.newDynamicEffect")}
              description={t("settings.tabs.newDynamicEffectHint")}
            >
              <Switch
                aria-label={t("settings.tabs.newDynamicEffect")}
                checked={newTabsDynamicEffect}
                className={`justify-self-end ${settingsControlSurface} focus-visible:border-ring`}
                style={{
                  backgroundColor: newTabsDynamicEffect ? color : undefined,
                }}
                onCheckedChange={(enabled) => {
                  setNewTabsDynamicEffect(enabled)
                  setApplyExisting(enabled)
                }}
              />
            </SettingItem>
            <SettingItem label={t("settings.tabs.texture")}>
              <EffectStylePicker
                value={tabTexture}
                color={color}
                onChange={setTabTexture}
                labelKey="settings.tabs.texture"
              />
            </SettingItem>
            {(tabTexture === "burning" || tabTexture === "particles") && (
              <SettingItem
                label={t("settings.tabs.effectCoverage")}
                htmlFor="tab-effect-coverage"
              >
                <SettingRange
                  id="tab-effect-coverage"
                  label={t("settings.tabs.effectCoverage")}
                  min={MIN_TAB_EFFECT_COVERAGE}
                  max={MAX_TAB_EFFECT_COVERAGE}
                  value={tabEffectCoverage}
                  onChange={setTabEffectCoverage}
                  accentColor={color}
                  editable={false}
                  formatValue={(value) => `${value}%`}
                />
              </SettingItem>
            )}
          </>
        }
      />
      <AlertDialog
        open={applyExisting !== null}
        onOpenChange={(open) => {
          if (!open) setApplyExisting(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                applyExisting
                  ? "settings.tabs.applyExistingEnableTitle"
                  : "settings.tabs.applyExistingDisableTitle"
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                applyExisting
                  ? "settings.tabs.applyExistingEnableDescription"
                  : "settings.tabs.applyExistingDisableDescription"
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {t(
                applyExisting
                  ? "settings.tabs.onlyNewTabsEnable"
                  : "settings.tabs.onlyNewTabsDisable"
              )}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (applyExisting !== null)
                  setAllTabDynamicEffects(applyExisting)
                setApplyExisting(null)
              }}
            >
              {t(
                applyExisting
                  ? "settings.tabs.applyAllTabsEnable"
                  : "settings.tabs.applyAllTabsDisable"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
