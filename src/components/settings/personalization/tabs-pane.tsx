import { useLayoutEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { createTabItem } from "@/lib/grid/factory"
import EffectStylePicker from "./effect-style-picker"
import ScaledGridPreview from "./scaled-grid-preview"
import { ArrowCounterClockwise } from "@phosphor-icons/react"
import { Button } from "@/components/ui/button"
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
  DEFAULT_TAB_EFFECT_COVERAGE,
  MAX_TAB_EFFECT_COVERAGE,
  MIN_TAB_EFFECT_COVERAGE,
  useHomeSettingsStore,
} from "@/stores/home-settings-store"
import { useTabGridStore } from "@/stores/tab-grid-store"
import SettingItem from "../shared/setting-item"
import { settingsControlSurface } from "../shared/control-styles"

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

// One 4x2 tab on the left, two 4x1 tabs stacked on the right — centered
// as a group under the select row.
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
      {trackWidth > 0 && (
        <ScaledGridPreview
          items={preview.items}
          trackWidth={trackWidth}
          area={preview.area}
          positions={preview.positions}
        />
      )}
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
          <div className="flex w-full min-w-0 items-center gap-2">
            <div
              className={`flex h-8 min-w-0 flex-1 items-center gap-2 rounded-2xl px-3 ${settingsControlSurface}`}
            >
              <input
                id="tab-effect-coverage"
                type="range"
                min={MIN_TAB_EFFECT_COVERAGE}
                max={MAX_TAB_EFFECT_COVERAGE}
                step="1"
                value={tabEffectCoverage}
                onChange={(event) =>
                  setTabEffectCoverage(Number(event.target.value))
                }
                className="min-w-0 flex-1"
                style={{ accentColor: color }}
              />
              <output
                htmlFor="tab-effect-coverage"
                className="w-10 text-right text-xs tabular-nums"
              >
                {tabEffectCoverage}%
              </output>
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              className="size-8 shrink-0 rounded-2xl border border-border"
              aria-label={t("settings.tabs.resetEffectCoverage")}
              title={t("settings.tabs.resetEffectCoverage")}
              onClick={() => setTabEffectCoverage(DEFAULT_TAB_EFFECT_COVERAGE)}
            >
              <ArrowCounterClockwise />
            </Button>
          </div>
        </SettingItem>
      )}
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
