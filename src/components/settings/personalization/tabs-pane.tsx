import { useLayoutEffect, useState } from "react"
import TabGrid from "@/components/tab-grid/tab-grid"
import { createTabItem } from "@/components/tab-grid/factory"
import EffectStylePicker from "./effect-style-picker"
import { Switch } from "@/components/ui/switch"
import type { GridItem, TabItem } from "@/lib/grid/types"
import { useHomeSettingsStore } from "@/stores/home-settings-store"
import { settingsControlSurface } from "../shared/control-styles"

const appIcon = `${import.meta.env.BASE_URL}icons/icon-128.png`

function previewTab(name: string, size: "small" | "medium"): TabItem {
  return {
    ...createTabItem({ name, url: "https://oh-my-tab.example" }),
    size,
    icon: appIcon,
  }
}

// One 4x2 tab on the left, two 4x1 tabs stacked on the right — centered
// as a group under the select row.
const preview = (() => {
  const [medium, smallA, smallB] = [
    previewTab("Oh My Tab", "medium"),
    previewTab("新标签页", "small"),
    previewTab("扩展", "small"),
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
})()

function homeGridTrackWidth() {
  return (
    document.querySelector("[data-tab-grid-track]")?.getBoundingClientRect()
      .width ?? 0
  )
}

export default function TabsPane() {
  const tabTexture = useHomeSettingsStore((state) => state.tabTexture)
  const setTabTexture = useHomeSettingsStore((state) => state.setTabTexture)
  const amplitude = useHomeSettingsStore((state) => state.burningAmplitude)
  const setAmplitude = useHomeSettingsStore(
    (state) => state.setBurningAmplitude
  )
  const entrance = useHomeSettingsStore((state) => state.transitionsEnabled)
  const setEntrance = useHomeSettingsStore(
    (state) => state.setTransitionsEnabled
  )
  const color = useHomeSettingsStore((state) => state.color)
  const [trackWidth, setTrackWidth] = useState(homeGridTrackWidth)

  useLayoutEffect(() => {
    const measure = () => setTrackWidth(homeGridTrackWidth())
    measure()
    window.addEventListener("resize", measure)
    return () => window.removeEventListener("resize", measure)
  }, [])

  return (
    <>
      {trackWidth > 0 && (
        <div className="flex justify-center">
          <TabGrid
            preview
            items={preview.items}
            trackWidth={trackWidth}
            area={preview.area}
            previewPositions={preview.positions}
          />
        </div>
      )}
      <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
        <span className="text-sm">标签纹理</span>
        <EffectStylePicker
          value={tabTexture}
          color={color}
          onChange={setTabTexture}
          label="标签纹理"
        />
      </div>
      {tabTexture !== "none" && (
        <>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <label htmlFor="burning-amplitude" className="text-sm">
              {tabTexture === "burning" ? "燃烧幅度" : "呼吸幅度"}
            </label>
            <div
              className={`flex h-8 min-w-0 items-center gap-2 rounded-2xl px-3 ${settingsControlSurface}`}
            >
              <input
                id="burning-amplitude"
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={amplitude}
                onChange={(event) =>
                  setAmplitude(Number(event.target.value))
                }
                className="min-w-0 flex-1"
                style={{ accentColor: color }}
              />
              <output
                htmlFor="burning-amplitude"
                className="w-10 text-right text-xs tabular-nums"
              >
                {Math.round(amplitude * 100)}%
              </output>
            </div>
          </div>
          <div className="grid grid-cols-2 items-center gap-3 sm:grid-cols-[minmax(0,1fr)_11rem]">
            <span className="text-sm">过渡效果</span>
            <Switch
              aria-label="过渡效果"
              checked={entrance}
              className={`justify-self-end ${settingsControlSurface} focus-visible:border-ring`}
              style={{ backgroundColor: entrance ? color : undefined }}
              onCheckedChange={setEntrance}
            />
          </div>
        </>
      )}
    </>
  )
}
